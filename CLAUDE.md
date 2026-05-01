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

**Ausnahme:** Wenn Frank in einem Live-Test eine konkrete Korrektur fordert, hat das Vorrang vor dem Mockup (z.B. „verwende den existierenden BackButton statt der breiten BackRow"). Solche Abweichungen kommentieren.

## Design-Tokens

Farben + Fonts zentral in `app/globals.css` `@theme {}`. Tailwind-Utilities daraus:
`bg-cream`, `bg-rust`, `bg-forest`, `bg-tan`, `bg-gold`, `bg-paper`, `bg-cornsilk`,
`text-ink`, `text-mist`, `text-slate`,
`font-alfa` (Alfa Slab One, Logo/Hero/Spielername), `font-oswald` (Labels/Tabellen),
`font-work` (Body).

Keine Hex-Werte in Komponenten — wenn ein neuer Farbwert nötig ist, in `@theme` ergänzen.

Custom-CSS außerhalb @theme (z.B. Scrollbar) MUSS in `@layer utilities { ... }`,
sonst wird's von Tailwind 4 / Turbopack nicht in den Bundle aufgenommen.

## Next.js 16 — wichtige Abweichungen

- **Middleware heißt jetzt Proxy.** Datei: `proxy.ts` (nicht `middleware.ts`) im Repo-Root. Funktion: `export function proxy(request: NextRequest)` (nicht `middleware`). Functionality identisch.
- **`cookies()` ist async** — `const cookieStore = await cookies()` in Server Components / Server Actions.
- Die Regel aus `AGENTS.md` (vor jedem Coden den passenden Guide unter `node_modules/next/dist/docs/` lesen) gilt für alles Next-spezifische — die Defaults haben sich an mehreren Stellen geändert.

## Auth-Pattern (`@supabase/ssr`)

Drei Clients:
- **`lib/supabase-server.ts`** — Server-Components + Server-Actions, Cookie-Store via `next/headers`. Setzt Cookies wenn möglich (try/catch für Read-Only-Kontext).
- **`lib/supabase-browser.ts`** — Client-Components, `createBrowserClient` für Auth-Operationen (Login, Logout).
- **`proxy.ts`** — Token-Refresh per `await supabase.auth.getUser()`. Schreibt frische Cookies bei jedem Request.

Auth-Guard:
- Route Group `(authed)` unter `/admin/` mit eigenem `layout.tsx` der `getUser()` checkt und auf `/admin/login` redirectet.
- `/admin/login` liegt **außerhalb** der Route Group, sonst würde der Guard ihn auch blocken.
- Service-Role-Key in `.env.local` als `SUPABASE_SERVICE_ROLE_KEY` für Skripte (`scripts/admin_open_st.py` etc.) — umgeht RLS, niemals im Frontend benutzen.

## Excel als Datenquelle (`Windmill_Poker_results_test.xlsx`)

**Source of Truth = Sheet "Auszahlungen"**, nicht "2025". Auszahlungen hat alle 12+ STs
horizontal mit Σ + €/Spt + Teilnahmen.

- R13: ST-Header `ST1..ST12+`, R14: Datum, R15: Spielerzahl, R16: Topf
- R17–R27: 11 Spieler (Frank, Peter, Friedl, Werner, Rainer, Jochen, Torben, Jörg,
  Ciano, Jens, Martin) mit Auszahlung pro ST
- `0` in einer Zelle ist **mehrdeutig**: kann "teilgenommen, kein Gewinn" oder
  "alte Formel-Ausgabe / nicht teilgenommen" bedeuten. Discriminator ist die
  Teilnahmen-Spalte (C16): wenn Excel-Teilnahmen < Anzahl-non-blank-Zellen,
  sind manche `0`s Placeholder.

Re-Seed-Skripte (für Initial-Setup oder Reset):
- `scripts/seed_v2.py` — kompletter Re-Import aus Auszahlungen, Reset+Insert
- `scripts/verify_v2.py` — Zell-für-Zell-Cross-Check Excel↔DB

Helper-Skripte für nachträgliche STs / Cleanup:
- `scripts/admin_open_st.py open|close|delete --date YYYY-MM-DD [--players ...]`
- `scripts/rewire_planning.py --from --to --next` — verschiebt next_game_planning + next_game_date

## Daten-Stand (2026-05-01)

- 13 game_days in DB, alle `is_closed=true`. ST 13 (2026-04-16) ist jüngster und trägt `next_game_date=2026-05-07` + die `next_game_planning` für ST 14.
- ST 11 (19.02.2026) Frank-Tagessieg mit 100€.
- ST 12 (05.03.2026) und ST 13 (16.04.2026) wurden am 2026-05-01 über die UI rückwirkend eingegeben (echte Daten).

## Tagessieger-Logik vs. Rundengewinn-Logik

**Tagessieger** (für /spieler/[id], /spieltage Expander, übergreifende Stats):
- Spieler mit höchstem Gesamt-Payout (Summe aller round_results für den ST).
- **Nur eindeutig**: bei Gleichstand → kein Tagessieger (kein Highlight).
- Visualisierung: rust (`#C94A2B`) + `font-weight:700`.

**Rundengewinn-Highlight** (in `/admin` Eingabe-Form, pro Runde):
- Alle Spieler mit `payout === max && max > 0` werden hervorgehoben (auch bei Tie alle rot).
- Kein Top-2-Highlight. Häufig teilen sich die ersten 2 Plätze den Topf — beide rot.

## Routing-Konventionen

- `/` = Deckblatt (kein Bottom-Tab aktiv)
- `/ranking` = Moneylist (Tab "Ranking"), `?view=avg` = €/Spieltag-Variante
- `/spieltage` = Liste mit `<details>`-Expandern (kein Client-State nötig)
- `/spieler`, `/spieler/[id]` = Liste + Profil (Tab "Spieler")
- `/teilnehmer`, `/gallerie`, `/gallerie/[id]` = Sub-Screens vom Deckblatt (kein Tab aktiv)
- `/admin/login` = Login-Page (außerhalb Auth-Guard)
- `/admin` = Eingabe Spieltag (Sub-Tab) — wenn kein offener ST, redirect zu `/admin/naechster`
- `/admin/naechster` = Nächster Spieltag (Sub-Tab)
- `/admin/spielerverwaltung` = Sub-Page mit eigenem BackButton, kein Sub-Tab aktiv

## Frank's Spielabend-Workflow

Sequentiell — die UI führt Frank in dieser Reihenfolge:

1. **/admin** (Eingabe Spieltag): R1 erfassen + speichern
2. R2-Tab: R2 erfassen + speichern → **Auto-Redirect** zu /admin/naechster (sobald beide Runden saved sind)
3. **/admin/naechster**: Datum für nächsten Spieltag setzen
4. Teilnehmer-Abfrage (wer kann nicht → status=cancelled, Warteliste rückt automatisch auf)
5. **„Spieltag abschließen"** (kein Confirm — finaler bewusster Klick): aktueller ST closed, neuer ST + attendances aus Planung angelegt, alte Planung gelöscht, Redirect zu /admin (Eingabe für neuen ST)

**UX-Regeln aus diesem Workflow:**
- Keine Confirm-Dialogs bei bewussten Aktionen — Frank hasst sie.
- Hinweis-Text über Buttons darf den Effekt erklären, aber knapp und zentriert.
- Wording fokussiert auf das was abgeschlossen wird (z.B. „Spieltag 13 abschließen"), nicht auf das was startet.
- Empty-States vermeiden, wenn ein sinnvoller Redirect-Target existiert.
