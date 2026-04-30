# Windmill Poker — Canonical Mockups

**Diese Dateien sind die einzige Quelle der Wahrheit für das visuelle Design.**

| Datei | Screen | Status |
|---|---|---|
| `moneylist.html` | Ranking / Moneylist (Hauptseite) | final (v14) |
| `deckblatt.html` | Cover mit Countdown + Teilnehmer-Liste | final (v3) |
| `admin.html` | Admin (Eingabe / Nächster Spieltag / Spielerverwaltung) | final (v3) |
| `spieltage.html` | Spieltage-Liste mit Status-Pills | final (v2) |

## Regel beim Frontend-Porten

Beim Bauen einer React-Komponente:

1. Mockup-HTML im Browser öffnen (Doppelklick auf die `.html`).
2. Die inline-Styles **1:1 übernehmen**, nicht reinterpretieren. Wenn Mockup `padding:0 16px` sagt, ist es nicht `py-1 px-4`. Wenn da `height:140px;width:auto` für ein Logo steht (auch wenn das das Header-Box "überlappt"), ist das **Absicht** und so umzusetzen.
3. Design-Tokens (Farben, Fonts) sind in `app/globals.css` als Tailwind-`@theme` zentralisiert. Werte hier ergänzen, nicht in Komponenten hardcoden.
4. Bei Abweichung wegen technischer Notwendigkeit (z.B. responsive Layout): erst Frank fragen, nicht eigenmächtig.
