@AGENTS.md

# Windmill Poker — Hard Rules

## Mockups sind Pixel-Vorgabe, nicht Inspiration

`docs/mockups/*.html` sind die fertigen, abgenommenen Visual-Specs (2 Tage Arbeit).
Beim Bauen einer React-Komponente:

1. Das passende Mockup im Browser öffnen, **inline-Styles 1:1 portieren**.
2. Nicht reinterpretieren, nicht "vereinfachen", nicht aus dem Gedächtnis.
3. Auch ungewöhnliche Werte sind Absicht (z.B. Logo `height:140px` in einem `height:80px` Header → Logo überlappt bewusst).

## Design-Tokens

Farben + Fonts zentral in `app/globals.css` `@theme {}`. Tailwind-Utilities daraus:
`bg-cream`, `bg-rust`, `bg-forest`, `bg-tan`, `text-ink`, `text-mist`, `text-slate`,
`font-alfa` (Alfa Slab One, Logo), `font-oswald` (Labels/Tabellen), `font-work` (Body).
Keine Hex-Werte in Komponenten — wenn ein neuer Farbwert nötig ist, in `@theme` ergänzen.

## Daten

Alle Spieler/Spieltage/Auszahlungen sind echte Daten in der Cloud-DB (`moneylist`-View
matcht Excel-Rangliste 1:1). Wenn ein Wert vom Mockup abweicht, ist das **Absicht**:
das Mockup ist eine alte Daten-Schnappschuss, die Realität gewinnt.
