-- Zwei historische 0-EUR-Teilnahmen stehen im Excel-Backup, fehlten aber in
-- public.attendances. Dadurch waren Teilnehmerzahl und Durchschnitt falsch.
-- Die Namens-/Datumszuordnung ist eindeutig; ON CONFLICT macht die Korrektur
-- bei einer erneuten Ausfuehrung sicher.

INSERT INTO public.attendances (game_day_id, player_id)
SELECT gd.id, p.id
FROM (
    VALUES
        ('2026-02-19'::DATE, 'Torben'::TEXT),
        ('2025-08-21'::DATE, 'Jens'::TEXT)
) AS correction(played_on, player_name)
INNER JOIN public.game_days gd
    ON gd.played_on = correction.played_on
   AND gd.is_closed = TRUE
INNER JOIN public.players p
    ON p.name = correction.player_name
ON CONFLICT (game_day_id, player_id) DO NOTHING;
