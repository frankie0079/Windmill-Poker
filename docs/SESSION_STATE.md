# Session State — Windmill Poker

> Wird am Ende jeder Session aktualisiert. Beim Start als erstes lesen.

**Letzte Session:** 2026-06-12
**Branch:** `master` · **Letzter Commit:** wird nach diesem Commit aktualisiert (finale Anwesenheit + ST15/ST16 korrigiert)

## Wo wir stehen

- **Phase 1 Design + 1.5 Mockup-Erweiterung** ✓ abgeschlossen.
- **Phase 2 Backend-Fundament** ✓ abgeschlossen. Supabase live, Schema + RLS + Storage gepusht.
- **Phase 3 Seed-Import** ✓ abgeschlossen. Re-Seed v2 aus Auszahlungen-Sheet (11 STs inkl. ST11 19.02.26).
- **Phase 4 Next.js-Skeleton** ✓ abgeschlossen.
- **Phase 5 Frontend-Implementierung** ✓ **vollständig fertig**. Alle Read-Screens + Admin-Bereich (Login, Eingabe, Nächster, Spielerverwaltung) stehen mockup-treu. Spielabend-Lifecycle ist über die UI bedienbar.
- **Phase 6 Deploy + PWA** ✓ produktiv auf `https://windmill-poker-psj1.vercel.app`.
- **Google-Drive-Excel-Backup** ✓ produktiv eingerichtet und mit ST14/ST15 live getestet.
- **Finale Anwesenheit am Spieltag** ✓ produktiv: vor R1/R2 auf
  `/admin/naechster` echte Spieler setzen, unabhängig von automatischer
  Nachrückplanung.

Realistische Schätzung: Kernprodukt und Excel-Backup sind produktiv.

## Heute erledigt (2026-06-12)

- ST15 vom 11.06.2026 korrigiert: 7 Teilnehmer, Ciano als Teilnehmer mit 0/0,
  Jens entfernt, R1 140€, R2 140€, Gesamt 280€.
- ST15 geschlossen und ST16 für 02.07.2026 geöffnet.
- Google-Drive-Excel `Windmill_Poker_results.xlsx` aktualisiert und geprüft:
  ST15 genau einmal, Teilnehmer 7, Pot 280€, Ciano 0, Jens/Jörg/Torben leer.
- ST16-Planung gesetzt: 8 feste Teilnehmer (Ciano, Frank, Friedl, Jens,
  Jochen, Peter, Rainer, Werner), Warteliste Jörg Rang 1, Torben Rang 2.
- Neue UI `Anwesenheit am Spieltag` auf `/admin/naechster` gebaut und deployed:
  alle aktiven Spieler mit `da`/`nicht da`; Quelle für `/admin` R1/R2 sind
  danach die tatsächlichen `attendances`.
- Commit `82c359b Add final game day attendance controls` auf `master`
  gepusht und aktiv deployed.

## Heute erledigt (2026-06-09)

- Google Cloud-Projekt `Windmill Poker backup`, Drive API und
  Computerprogramm-Konto eingerichtet.
- `Windmill_Poker_results.xlsx` für das Computerprogramm-Konto freigegeben.
- Server-seitiges, idempotentes Excel-Backup implementiert: neuester
  vollständiger Spieltag aus Supabase, Eingabemaske, Spieltagsspalte, Summen
  und Teilnahmen werden aktualisiert.
- Dauerhaft sichtbaren Button `Excel-Backup aktualisieren` auf
  `/admin/naechster` ergänzt.
- ST14 vom 07.05.2026 erfolgreich live in Google Drive aktualisiert und geprüft:
  8 Teilnehmer, R1 160 €, R2 160 €, Gesamt 320 €, ST14 genau einmal vorhanden.
- Aktives Vercel-Projekt identifiziert: `windmill-poker-psj1`. Google-Variablen
  für Production gesetzt und neue Version veröffentlicht.
- PWA-Manifest, Icons, Service Worker und Sicherheitsheader produktiv ausgerollt.

## Heute erledigt (2026-05-01)

**Auth-Setup (`@supabase/ssr`):**
- `lib/supabase-server.ts` (Server Component / Server Action Client mit Cookie-Session).
- `lib/supabase-browser.ts` (Client Component Client).
- `proxy.ts` im Repo-Root (Next 16: Middleware heißt jetzt **Proxy**, Funktion `proxy()` statt `middleware()`). Token-Refresh per `getUser()`.
- Auth-User für Frank manuell in Supabase Dashboard angelegt (Email + Passwort, Auto-Confirm).

**Admin-Bereich (Phase 5 letztes Stück):**
- `app/admin/login/` — Login-Page mit Client-Form (Browser-Client `signInWithPassword`, Cookie-Session). Redirect auf /admin bei Erfolg.
- `app/admin/(authed)/layout.tsx` — Auth-Guard via Server-Session, redirect auf Login wenn nicht eingeloggt. Route Group damit Login selbst nicht geblockt wird.
- `app/admin/(authed)/page.tsx` (Eingabe Spieltag): R1/R2 Tab-Switch, Auszahlungs-Inputs pro Spieler, **live Pott-Check** (±2¢ Toleranz), **Top-Highlight bei Max-Wert (auch bei Tie alle rot)**. Save-Button mit Dirty-State-Tracking ("speichern" / "aktualisieren" / "✓ gespeichert"). **Auto-Redirect zu /admin/naechster nach R2-Save** (sobald beide Runden gespeichert sind). Wenn kein offener ST → redirect auf /admin/naechster (kein Empty-State-Fenster mehr).
- `app/admin/(authed)/naechster/` (Nächster Spieltag): Datum-Input (autosave), Teilnehmer-Toggle Dabei/Abgesagt, Warteliste mit Rang-Select (Swap-Logik bei Konflikt), Status-Box "✓ Bereit" / "⚠ X offen", **"Spieltag abschließen" Button** (kein Confirm — Klick = sofort die Action). Filtert inaktive Spieler aus Planung raus.
- `app/admin/(authed)/spielerverwaltung/` — CRUD: Toggle is_active, neuer Spieler anlegen, Trash mit Confirm bei ST-Count > 0. Nutzt den gleichen `BackButton` wie andere Detail-Pages.
- `components/admin/AdminSubTabs.tsx`, `LogoutButton.tsx`. (`AdminBackRow` wieder gelöscht — nicht mehr benötigt nach UX-Korrektur.)

**Spielabend-Lifecycle (`closeAndStartNext` Server Action):**
- Schließt aktuellen ST (`is_closed=true`) + räumt next_game_date ab.
- Legt neuen ST mit attendances aus (confirmed + nachgerückte Wartelistler) an.
- Löscht alte next_game_planning. Redirect auf /admin (Eingabe-Form für neuen ST).

**Real-World-Test mit ST 12 + ST 13:**
- Frank hat über die UI rückwirkend ST 12 (05.03.) und ST 13 (16.04.) erfasst. Daten via Excel-Source-of-Truth-Screenshot abgeglichen, R1+R2-Eingabe pro ST ohne Bugs durchgelaufen.
- ST 12: Frank, Peter, Friedl, Werner, Rainer, Jochen, Ciano, Jens (8 Spieler), Σ=320€.
- ST 13: Frank, Peter, Friedl, Jörg, Rainer, Jochen, Torben, Ciano (8 Spieler), Σ=320€.
- Cleanup-Helpers gebaut: `scripts/admin_open_st.py` (open/close/delete), `scripts/rewire_planning.py` (next_game_planning + next_game_date umhängen).

**UX-Korrekturen aus dem Live-Test:**
- Top-Highlight pro Runde: jetzt **alle Spieler mit Max-Wert** rot (auch bei Tie), kein Top-2-Highlight mehr.
- Save-Button-Label nach Reload korrekt (dirty-State-Tracking).
- Hinweis-Block nach beidem Speichern: kompakt zentriert "✓ Spieltag DATUM vollständig erfasst" (kein Kleingedrucktes).
- Empty-State auf /admin → komplett raus, redirect zu /admin/naechster.
- Confirm-Dialog beim "Spieltag abschließen" raus — Frank's Workflow ist sequentiell, der Klick ist der bewusste finale Schritt.
- BackButton in Spielerverwaltung: vom breiten Mockup-Style auf den kompakten `BackButton` der anderen Pages umgestellt.

**Frank's Spielabend-Workflow (final):**
1. /admin (Eingabe): R1 erfassen + speichern
2. R2-Tab: R2 erfassen + speichern → autoredirect zu /admin/naechster
3. /admin/naechster: Datum für nächsten Spieltag setzen
4. Teilnehmer-Abfrage (wer kann nicht → cancelled, Warteliste rückt auf)
5. "Spieltag abschließen" → Lifecycle: aktueller ST closed, neuer ST + attendances aus Planung angelegt

**Lessons:**
- Next 16 hat Middleware umbenannt zu **Proxy**: `proxy.ts` im Root, `export function proxy()` statt `middleware()`. Funktional identisch.
- `cookies()` ist async in Next 15+ → `await cookies()` im Server Component / Server Action.
- `@supabase/ssr` Pattern: Server-Client + Browser-Client + Proxy für Token-Refresh. Saubere Cookie-Session statt localStorage.
- Frank's UX-Präferenz: **keine Confirm-Dialogs bei klaren bewussten Aktionen**; sequentielle Flows mit Auto-Redirects statt manuellem Tab-Wechsel; Wording fokussiert auf das was abgeschlossen wird, nicht auf das was startet.
- Top-Highlight-Logik pro Runde ≠ Tagessieger-Logik: pro Runde = Max-Wert (auch geteilt), Tagessieger = eindeutiger Max der Summe (bei Tie keiner).

## Offene Punkte für nächste Session

Siehe Memory `project_phase6_offene_schritte.md`. Kurz:

0. **BUG erledigt/obsolet:** Deckblatt `/` liest den nächsten Spieltag über `loadUpcomingGame()` und filtert nicht mehr auf `is_closed=false`. Live-Check am 2026-05-29 zeigt ST 2026-06-11 mit 8 Teilnehmern + 2 Warteliste.
1. **Optional aufräumen:** Das alte, falsch konfigurierte Vercel-Projekt
   `windmill-poker` liefert 404. Aktive PWA ist `windmill-poker-psj1`; nicht
   ungeprüft löschen oder Alias übertragen.
2. **Bar-Chart visuell prüfen** mit aktuellen Daten (~10 Min).
3. **Storage-Bucket-Migration** beim nächsten Setup robuster machen.

## Supabase

- **Project URL:** `https://dcqsvquklwjfhmsfpodo.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/dcqsvquklwjfhmsfpodo
- **Project Ref:** `dcqsvquklwjfhmsfpodo`
- **Auth:** Frank (Email + Passwort) als einziger Admin-User. Andere User via Supabase Auth Dashboard, RLS authenticated-only schützt alle Schreib-Operationen.
- **Anon-Key, Service-Role-Key, NEXT_PUBLIC_SUPABASE_URL/ANON_KEY:** in `.env.local` (gitignored).
- **DB-Stand:** ST15 (2026-06-11) geschlossen, 7 Teilnehmer, Gesamt 280€.
  ST16 (2026-07-02) offen, 8 Teilnehmer, Warteliste Jörg/Torben.
- **Helper-Skripte:** `scripts/admin_open_st.py` + `rewire_planning.py` (für Cleanup / einmalige rückwirkende Eingaben). `seed_v2.py` + `verify_v2.py` für Initial-Seed.

## Frontend-Stack

- **Next.js 16.2.4 + React 19.2.4** (Turbopack)
- **Tailwind 4** (CSS-first config in `app/globals.css` `@theme {}`)
- **`@supabase/ssr` 0.x** für Cookie-Session-Auth
- **Fonts:** Alfa Slab One (Logo/Hero), Oswald (Labels/Tabellen), Work Sans (Body) — alle via `next/font/google`
- **Dev-Server:** `npm run dev` → http://localhost:3000
- **Routes:**
  - Public: `/` (Deckblatt), `/ranking` (mit `?view=avg`), `/spieltage`, `/spieler`, `/spieler/[id]`, `/teilnehmer`, `/gallerie`, `/gallerie/[id]`
  - Admin: `/admin/login`, `/admin` (Eingabe), `/admin/naechster`, `/admin/spielerverwaltung`

## GitHub

- **Remote:** https://github.com/frankie0079/Windmill-Poker.git
- Pushes ab 2026-04-30 aktiv.

## Visual Companion

- **Server-Skript:** `C:\DEV\sandbox\superpowers-framework\skills\brainstorming\scripts\start-server.sh`
- **Letzte Session-Dir:** `.superpowers/brainstorm/801-1777469477/`
- **Hinweis:** Mockups jetzt redundant in `docs/mockups/`, brainstorm-Dirs nur noch für Workflow-Historie.

## Produktion

- **Aktive URL:** `https://windmill-poker-psj1.vercel.app`
- **Aktives Vercel-Projekt:** `windmill-poker-psj1`
- **Altes Vercel-Projekt:** `windmill-poker`, Framework `Other`, derzeit 404
- **Excel-Backup:** Google-Drive-Zugangsdaten in Vercel Production gesetzt;
  Details in `docs/GOOGLE_DRIVE_EXCEL_BACKUP.md`
- **Spielabend-Korrekturen:** Vor R1/R2 die finale Anwesenheit auf
  `/admin/naechster` setzen. Nicht mehr voraussetzen, dass immer 8 Spieler
  kommen oder dass Wartelistler automatisch in Reihenfolge nachrücken.

## Hinweis an mich (Claude)

Beim nächsten Start:
- Memory + dieser SESSION_STATE laden automatisch.
- **Erste Frage über AskUserQuestion:** Phase 6 Vercel-Deploy + PWA jetzt anpacken? (Sehr wahrscheinlich ja.)
- Frank ist bei Reibungspunkten allergisch — schnell zur Lösung statt zu raten.
- Fragen IMMER via `AskUserQuestion` mit klickbaren Optionen.
- Wenn ich auf User-Aktion warte: explizit als ersten Satz "ich pausiere".
- Wenn ich um Browser/Screenshot bitte: **Link IMMER mit in der Nachricht**, prominent.
- Mockup-Pixel-Treue ist nicht verhandelbar (`docs/mockups/*.html` = Source of Truth) — außer Frank korrigiert explizit (z.B. BackButton-Tausch in Spielerverwaltung).
- Excel-Source-of-Truth = Sheet "Auszahlungen" (CLAUDE.md hat Regeln dazu).
- **Frank's Workflow: keine Confirm-Dialogs bei klaren Aktionen.** Lieber gut platzierter Hinweis-Text + sofortige Action. Sequentielle Flows mit Auto-Redirects.
- Wenn Frank reale Spielabend-Abweichungen meldet, zuerst DB und Excel
  konkret prüfen, dann gezielt korrigieren. Planung != tatsächliche Anwesenheit.
