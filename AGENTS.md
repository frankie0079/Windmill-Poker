<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Windmill Poker - aktuelle Arbeitsregeln

- Aktive PWA: `https://windmill-poker-psj1.vercel.app`.
- Aktives Vercel-Projekt: `windmill-poker-psj1`. Das alte Projekt
  `windmill-poker` ist falsch konfiguriert und aktuell nicht die Ziel-PWA.
- Spielabend-Praxis: Planung und echte Anwesenheit sind getrennt. Vor R1/R2 auf
  `/admin/naechster` im Abschnitt `Anwesenheit am Spieltag` final setzen, wer
  wirklich da ist. `/admin` zeigt danach genau diese Spieler fuer R1/R2.
- Nach gespeicherten Ergebnissen ist die Anwesenheit nicht mehr ueber die UI
  aenderbar; Korrekturen dann nur gezielt per Admin-/Service-Role-Eingriff.
- Excel-Backup: Button `Excel-Backup aktualisieren` auf `/admin/naechster`
  schreibt den neuesten vollstaendigen Spieltag in
  `Windmill_Poker_results.xlsx` auf Google Drive. Zugangsdaten nie committen.
- Aktueller Datenstand am 12.06.2026: ST15 vom 11.06.2026 ist geschlossen,
  7 Teilnehmer, Gesamtpot 280 EUR, Ciano 0/0, Jens leer; Excel ST15 geprueft.
  ST16 am 02.07.2026 ist offen mit 8 Teilnehmern und Warteliste Joerg Rang 1,
  Torben Rang 2.
