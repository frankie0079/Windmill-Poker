-- Offene, nur geplante Spieltage duerfen weder die Teilnahmezahl noch den
-- Durchschnittsgewinn der ewigen Rangliste veraendern. Gewinne werden aus
-- demselben Grund erst nach Abschluss eines Spieltags beruecksichtigt.

CREATE OR REPLACE VIEW public.moneylist AS
SELECT
    p.id,
    p.name,
    COALESCE(rr_agg.total_winnings, 0)::NUMERIC(10, 2) AS total_winnings,
    COALESCE(a_agg.game_days_played, 0)                AS game_days_played,
    CASE
        WHEN COALESCE(a_agg.game_days_played, 0) > 0
        THEN ROUND(COALESCE(rr_agg.total_winnings, 0) / a_agg.game_days_played, 2)
        ELSE 0
    END AS avg_per_gameday
FROM public.players p
LEFT JOIN (
    SELECT rr.player_id, SUM(rr.payout) AS total_winnings
    FROM public.round_results rr
    INNER JOIN public.game_days gd ON gd.id = rr.game_day_id
    WHERE gd.is_closed = TRUE
    GROUP BY rr.player_id
) rr_agg ON rr_agg.player_id = p.id
LEFT JOIN (
    SELECT a.player_id, COUNT(DISTINCT a.game_day_id) AS game_days_played
    FROM public.attendances a
    INNER JOIN public.game_days gd ON gd.id = a.game_day_id
    WHERE gd.is_closed = TRUE
    GROUP BY a.player_id
) a_agg ON a_agg.player_id = p.id
WHERE p.is_active = TRUE
ORDER BY total_winnings DESC;
