@AGENTS.md

# Windmill Poker — Hard Rules

## Mockups sind Pixel-Vorgabe, nicht Inspiration

`docs/mockups/*.html` sind die fertigen, abgenommenen Visual-Specs (2 Tage Arbeit).
Beim Bauen einer React-Komponente:

1. Das passende Mockup im Browser öffnen, **inline-Styles 1:1 portieren**.
2. Nicht reinterpretieren, nicht "vereinfachen", nicht aus dem Gedächtnis.
3. Auch ungewöhnliche Werte sind Absicht (z.B. Logo `height:140px` in einem `height:80px` Header → Logo überlappt bewusst).

Mockup-Dateien:
- `moneylist.html` — Ranking-Tabelle
- `spieltage.html` — Spieltage-Liste mit Status-Pills
- `profil.html` — Spielerprofil (Stat-Karten, Bar-Chart, Spieltage-Tabelle)
- `deckblatt.html` — Cover + Teilnehmer + Gallerie + Foto-Detail
- `admin.html` — Admin-Screen

## Design-Tokens

Farben + Fonts zentral in `app/globals.css` `@theme {}`. Tailwind-Utilities daraus:
`bg-cream`, `bg-rust`, `bg-forest`, `bg-tan`, `bg-gold`, `bg-paper`, `bg-cornsilk`,
`text-ink`, `text-mist`, `text-slate`,
`font-alfa` (Alfa Slab One, Logo/Hero/Spielername), `font-oswald` (Labels/Tabellen),
`font-work` (Body).

Keine Hex-Werte in Komponenten — wenn ein neuer Farbwert nötig ist, in `@theme` ergänzen.

Custom-CSS außerhalb @theme (z.B. Scrollbar) MUSS in `@layer utilities { ... }`,
sonst wird's von Tailwind 4 / Turbopack nicht in den Bundle aufgenommen.

## Excel als Datenquelle (`Windmill_Poker_results_test.xlsx`)

**Source of Truth = Sheet "Auszahlungen"**, nicht "2025". Auszahlungen hat alle 12 STs
horizontal, sheet "2025" nur 10 STs in der Score-Matrix.

- R13: ST-Header `ST1..ST12`, R14: Datum, R15: Spielerzahl, R16: Topf
- R17–R27: 11 Spieler (Frank, Peter, Friedl, Werner, Rainer, Jochen, Torben, Jörg,
  Ciano, Jens, Martin) mit Auszahlung pro ST in C2..C13, Σ in C14, €/Spt in C15,
  Teilnahmen in C16
- ST12 in der Excel ist **Platzhalter** (alle Werte 0, Spieltag noch nicht gespielt)
  → beim Seed-Import überspringen.
- `0` in einer Zelle ist **mehrdeutig**: kann "teilgenommen, kein Gewinn" oder
  "alte Formel-Ausgabe / nicht teilgenommen" bedeuten. Discriminator ist die
  Teilnahmen-Spalte (C16): wenn Excel-Teilnahmen < Anzahl-non-blank-Zellen,
  sind manche `0`s Placeholder.
- Anwesenheit für ST1–ST10 kommt aus Sheet "2025" Anwesend-Matrix
  (R14, R24, ... R108). Für ST11 wird sie über Differenz `Excel-Teilnahmen
  − Anwesend-Sheet-2025-Count` ermittelt.

Re-Seed-Skripte:
- `scripts/seed_v2.py` — kompletter Re-Import aus Auszahlungen, Reset+Insert
- `scripts/verify_v2.py` — Zell-für-Zell-Cross-Check Excel↔DB

## Daten

Cloud-DB matcht Excel zellgenau (Σ + Teilnahmen pro Spieler ✓✓). Wenn ein UI-Wert
unerwartet aussieht: erst die Excel-Source prüfen, nicht das UI raten.

ST 11 = 19.02.2026, Frank Tagessieg mit 100€.
ST 12 (05.03.26) ist in Excel angelegt aber leer (Platzhalter, in DB nicht enthalten).
Nächster geplanter Spieltag = 07.05.2026 (Donnerstag, 19:15) → in DB als
`ST11.next_game_date` mit `next_game_planning`-Liste (8 Teilnehmer + 3 Warteliste).
