-- =============================================================================
-- Fix moneylist View: kartesisches Produkt zwischen attendances und
-- round_results führt zu N-facher Aufsummierung (N = Anzahl Anwesenheiten).
-- Lösung: pro Spieler vor dem Join aggregieren.
-- =============================================================================

CREATE OR REPLACE VIEW public.moneylist AS
SELECT
    p.id,
    p.name,
    COALESCE(rr_agg.total_winnings, 0)::NUMERIC(10, 2)               AS total_winnings,
    COALESCE(a_agg.game_days_played, 0)                              AS game_days_played,
    CASE
        WHEN COALESCE(a_agg.game_days_played, 0) > 0
        THEN ROUND(COALESCE(rr_agg.total_winnings, 0) / a_agg.game_days_played, 2)
        ELSE 0
    END AS avg_per_gameday
FROM public.players p
LEFT JOIN (
    SELECT player_id, SUM(payout) AS total_winnings
    FROM public.round_results
    GROUP BY player_id
) rr_agg ON rr_agg.player_id = p.id
LEFT JOIN (
    SELECT player_id, COUNT(DISTINCT game_day_id) AS game_days_played
    FROM public.attendances
    GROUP BY player_id
) a_agg ON a_agg.player_id = p.id
WHERE p.is_active = TRUE
ORDER BY total_winnings DESC;
