# Session State — Windmill Poker

> Wird am Ende jeder Session aktualisiert. Beim Start als erstes lesen.

**Letzte Session:** 2026-04-30
**Branch:** `master` · **Letzter Commit:** wird nach diesem Commit aktualisiert (Phase 5 — Ranking-Toggle + Spieltage-Expander)

## Wo wir stehen

- **Phase 1 Design + 1.5 Mockup-Erweiterung** ✓ abgeschlossen.
- **Phase 2 Backend-Fundament** ✓ abgeschlossen. Supabase live, Schema + RLS + Storage gepusht.
- **Phase 3 Seed-Import** ✓ abgeschlossen. Re-Seed v2 aus Auszahlungen-Sheet (11 STs inkl. ST11 19.02.26 mit Frank-Tagessieg). Σ + Teilnahmen matchen Excel zellgenau.
- **Phase 4 Next.js-Skeleton** ✓ abgeschlossen. Next.js 16 + Tailwind 4 + Supabase-Client.
- **Phase 5 Frontend-Implementierung** ~85 % fertig. Alle Read-Screens stehen mockup-treu. Was offen ist:
  - **Admin-Screen** (`/admin`) — Sub-Tabs, Eingabe Spieltag, Nächster Spieltag, Spielerverwaltung, mit Supabase-Auth für Schreib-Operationen. Komplexester Screen, eigene Session.
- **Phase 6 Deploy + PWA** offen. Vercel + next-pwa + Service Worker. ~1 Std.

Realistische Schätzung: ca. 80 % des Gesamtwegs erledigt.

## Heute erledigt (2026-04-30)

**Phase 4 — Next.js-Skeleton:**
- `npx create-next-app@latest` (Next 16, React 19, Tailwind 4, App Router) ins Repo-Root.
- `@supabase/supabase-js`, `lib/supabase.ts`, `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` ergänzt.
- Mockups nach `docs/mockups/` gerettet (vorher gitignored), CLAUDE.md mit harter Regel "Mockups sind Pixel-Vorgabe".

**Phase 5 — Read-Screens:**
- `/` Deckblatt mit Countdown-Hero auf 07.05.2026 19:15 (Client-Component, Padding 07/02), Teilnehmer-Button, Gallerie-FAB.
- `/ranking` Moneylist + €/Spieltag-Toggle (klickbar, `?view=avg`, ≥8-Teilnahmen-Filter laut Spec). Top-1 rust+bold, Top-2/3 tan-Badge.
- `/spieltage` 11 STs mit Status-Pills (gold offen / forest abgeschlossen). Klickbar via `<details>`/`<summary>` (kein Client-State), Tagessieger im Detail rust+bold.
- `/spieler` alphabetische Liste, klickbar.
- `/spieler/[id]` Profil: Top-Bar mit Name + Zurück, 2 Platz-Badges (rust Moneylist / forest €/Spieltag), 3 Stat-Karten (Oswald 22 700), Bar-Chart (Tagessieger rust, 0 grau, sonst gold, Jahres-Trennstriche), Spieltage-Tabelle.
- `/teilnehmer` 8 + 3 Warteliste mit Pos-Badges.
- `/gallerie` Foto-Grid (Empty-State), `/gallerie/[id]` Foto-Detail mit Kommentar.
- Shared: `PhoneFrame`, `Header`, `BottomNav` (mit Routing), `BackButton`, `Countdown`.
- Sandige 4px-Scrollbar als `.scroll-warm` Utility (Tailwind 4 erfordert `@layer utilities`).

**Re-Seed v2 (kritisch):**
- Excel-Source-of-Truth gewechselt von Sheet "2025" zu Sheet "Auszahlungen" — letzteres hat alle 12 STs horizontal mit Σ + €/Spt + Teilnahmen.
- ST11 (19.02.26) korrekt importiert, Frank: 590€ / 11 / 53,64€ ✓.
- ST12 (05.03.26) Platzhalter (alle Werte 0) — übersprungen.
- ST11-Anwesenheit aus Differenz `Excel-Teilnahmen - Sheet-2025-Anwesend-Count`.
- `scripts/seed_v2.py` (Reset+Insert), `scripts/verify_v2.py` (Zell-für-Zell Cross-Check).
- Martin als Spieler angelegt (war im Mockup, fehlte in Excel-Anwesenheit).
- next_game_planning auf ST11: 8 Teilnehmer (Frank, Peter, Friedl, Jörg, Rainer, Jochen, Ciano, Torben) + 3 Warteliste (Werner-1, Jens-2, Martin-3).

**Lessons:**
- Excel hat manchmal mehrere Sheets; "Auszahlungen" war die echte Datenquelle, "2025" nur Score-Tracking-Matrix mit weniger STs. Beim Onboarding ALLE Sheets durchforsten.
- `0` in einer Excel-Zelle ist mehrdeutig — kann "teilgenommen, kein Gewinn" oder "Formel-Leftover/nicht teilgenommen" sein. Discriminator ist die Teilnahmen-Spalte.
- Tailwind 4 + Custom-CSS muss in `@layer utilities` rein, sonst tree-shaked vom Turbopack.
- `<details>`/`<summary>` für Inline-Expander spart einen Client-Component.

## Offene Punkte für nächste Session

1. **Admin-Screen** (`/admin`) — Sub-Tabs Eingabe/Nächster/Spielerverwaltung. Komplex: Schreib-Operationen, Supabase-Auth (nur Admin = Frank). Mockup `docs/mockups/admin.html`. Schritte:
   - Login-Page (Supabase Auth, magic link oder password).
   - `@supabase/ssr` Client für Cookie-Session.
   - RLS-Policies in DB sind schon authenticated-only.
   - Spieltag-Eingabe-Form: 11 Spieler aus next_game_planning, R1+R2-Inputs, Validierung Topf=N×40, INSERT round_results, attendances.
   - Nächster-Spieltag-Form: Datum, Teilnehmer 8+3 verschieben.
   - Spielerverwaltung: aktivieren/deaktivieren, neuen anlegen.
2. **Storage-Bucket-Migration nachschärfen** — beim nächsten Setup vermutlich wieder Reibung.
3. **Phase 6: Vercel-Deploy + next-pwa** — Service Worker, manifest.json, iPhone-Home-Screen-Icon.
4. **Bar-Chart vom Spielerprofil**: bei mehr als ~10 Spieltagen scrollt's horizontal — Sandig-Scrollbar via `.scroll-warm` ist drin, aber nochmal visuell prüfen sobald ST12+ Daten haben.

## Supabase

- **Project URL:** `https://dcqsvquklwjfhmsfpodo.supabase.co` (in `.env.local`)
- **Dashboard:** https://supabase.com/dashboard/project/dcqsvquklwjfhmsfpodo
- **Project Ref:** `dcqsvquklwjfhmsfpodo`
- **CLI verlinkt:** ja, `supabase migration list --linked` zeigt 3 Migrations
- **Anon-Key + Service-Role-Key:** in `.env.local` (gitignored)
- **NEXT_PUBLIC_SUPABASE_URL/ANON_KEY:** in `.env.local` für Frontend
- **DB-Passwort:** kennt Frank (manuell beim Linken eingegeben)
- **Setup-Skript:** `setup-supabase.bat` im Repo-Root (idempotent)
- **Seed-Skripte:** `python scripts/seed_v2.py` (autoritativ aus Auszahlungen) + `verify_v2.py`

## Frontend-Stack

- **Next.js 16.2.4 + React 19.2.4** (Turbopack)
- **Tailwind 4** (CSS-first config in `app/globals.css` `@theme {}`)
- **Fonts:** Alfa Slab One (Logo/Hero), Oswald (Labels/Tabellen), Work Sans (Body) — alle via `next/font/google`
- **Dev-Server:** `npm run dev` → http://localhost:3000
- **Routes:** `/` (Deckblatt), `/ranking` (mit `?view=avg`), `/spieltage`, `/spieler`, `/spieler/[id]`, `/teilnehmer`, `/gallerie`, `/gallerie/[id]`, `/admin` (TODO)

## GitHub

- **Remote:** https://github.com/frankie0079/Windmill-Poker.git
- Pushes ab heute aktiv.

## Visual Companion

- **Server-Skript:** `C:\DEV\sandbox\superpowers-framework\skills\brainstorming\scripts\start-server.sh`
- **Letzte Session-Dir:** `.superpowers/brainstorm/801-1777469477/`
- **Hinweis:** Mockups jetzt redundant in `docs/mockups/`, brainstorm-Dirs nur noch für Workflow-Historie.

## Hinweis an mich (Claude)

Beim nächsten Start:
- Memory + dieser SESSION_STATE laden automatisch.
- **Erste Frage über AskUserQuestion:** Admin jetzt anpacken (komplex, eigene Session) oder erst Phase 6 Deploy + PWA?
- Frank ist bei Reibungspunkten allergisch — schnell zur Lösung statt zu raten.
- Fragen IMMER via `AskUserQuestion` mit klickbaren Optionen.
- Wenn ich auf User-Aktion warte: explizit als ersten Satz "ich pausiere".
- Wenn ich um Browser/Screenshot bitte: **Link IMMER mit in der Nachricht**, prominent — Frank kann nicht hochscrollen.
- Mockup-Pixel-Treue ist nicht verhandelbar (`docs/mockups/*.html` = Source of Truth).
- Excel-Source-of-Truth = Sheet "Auszahlungen" (CLAUDE.md hat Regeln dazu).
