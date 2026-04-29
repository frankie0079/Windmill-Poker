-- =============================================================================
-- Initial Schema — Windmill Poker
-- Spec: docs/superpowers/specs/2026-04-27-poker-score-tracker-design.md
-- =============================================================================

-- Spieler (mit Soft-Delete via is_active)
CREATE TABLE public.players (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Spieltage (mit Abschluss-State und Datum für nächsten Spieltag)
CREATE TABLE public.game_days (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    played_on       DATE NOT NULL UNIQUE,
    next_game_date  DATE,
    is_closed       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teilnahme: wer war an welchem Spieltag dabei (immutable Historie)
CREATE TABLE public.attendances (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_day_id  UUID NOT NULL REFERENCES public.game_days(id) ON DELETE CASCADE,
    player_id    UUID NOT NULL REFERENCES public.players(id)   ON DELETE CASCADE,
    UNIQUE (game_day_id, player_id)
);

-- Rundenergebnisse (Cent-genau für geteilte Plätze, z.B. 6,66 €)
CREATE TABLE public.round_results (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_day_id   UUID NOT NULL REFERENCES public.game_days(id) ON DELETE CASCADE,
    player_id     UUID NOT NULL REFERENCES public.players(id)   ON DELETE CASCADE,
    round_number  SMALLINT NOT NULL CHECK (round_number IN (1, 2)),
    payout        NUMERIC(10, 2) NOT NULL DEFAULT 0,
    UNIQUE (game_day_id, player_id, round_number)
);

-- Planung des nächsten Spieltags: Teilnehmer-Bestätigungen + Warteliste.
-- game_day_id verweist auf den ABZUSCHLIESSENDEN Spieltag,
-- dessen Abschluss den nächsten Spieltag terminiert.
CREATE TABLE public.next_game_planning (
    game_day_id    UUID NOT NULL REFERENCES public.game_days(id) ON DELETE CASCADE,
    player_id      UUID NOT NULL REFERENCES public.players(id)   ON DELETE CASCADE,
    role           TEXT NOT NULL CHECK (role IN ('participant', 'waitlist')),
    status         TEXT CHECK (status IN ('confirmed', 'cancelled')),
    waitlist_rank  SMALLINT CHECK (waitlist_rank BETWEEN 1 AND 3),
    PRIMARY KEY (game_day_id, player_id),
    CHECK (
        (role = 'participant' AND status IS NOT NULL AND waitlist_rank IS NULL)
        OR
        (role = 'waitlist'    AND status IS NULL    AND waitlist_rank IS NOT NULL)
    )
);

-- Foto-Gallerie (Bilder liegen in Supabase Storage Bucket "gallery-photos")
CREATE TABLE public.gallery_photos (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_path  TEXT NOT NULL,
    comment       TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes für häufige Lookups
CREATE INDEX idx_attendances_player_id          ON public.attendances(player_id);
CREATE INDEX idx_attendances_game_day_id        ON public.attendances(game_day_id);
CREATE INDEX idx_round_results_player_id        ON public.round_results(player_id);
CREATE INDEX idx_round_results_game_day_id      ON public.round_results(game_day_id);
CREATE INDEX idx_game_days_played_on_desc       ON public.game_days(played_on DESC);
CREATE INDEX idx_gallery_photos_created_at_desc ON public.gallery_photos(created_at DESC);

-- =============================================================================
-- View: Moneylist (Ewige Rangliste) — filtert inaktive Spieler raus
-- =============================================================================
CREATE OR REPLACE VIEW public.moneylist AS
SELECT
    p.id,
    p.name,
    COALESCE(SUM(rr.payout), 0)::NUMERIC(10, 2) AS total_winnings,
    COUNT(DISTINCT a.game_day_id)               AS game_days_played,
    CASE
        WHEN COUNT(DISTINCT a.game_day_id) > 0
        THEN ROUND(COALESCE(SUM(rr.payout), 0) / COUNT(DISTINCT a.game_day_id), 2)
        ELSE 0
    END AS avg_per_gameday
FROM public.players p
LEFT JOIN public.attendances   a  ON a.player_id  = p.id
LEFT JOIN public.round_results rr ON rr.player_id = p.id
WHERE p.is_active = TRUE
GROUP BY p.id, p.name
ORDER BY total_winnings DESC;
