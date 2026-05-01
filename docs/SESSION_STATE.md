# Session State — Windmill Poker

> Wird am Ende jeder Session aktualisiert. Beim Start als erstes lesen.

**Letzte Session:** 2026-05-01
**Branch:** `master` · **Letzter Commit:** wird nach diesem Commit aktualisiert (Phase 5 — Admin-Bereich komplett, Spielabend-Lifecycle UI-gestützt)

## Wo wir stehen

- **Phase 1 Design + 1.5 Mockup-Erweiterung** ✓ abgeschlossen.
- **Phase 2 Backend-Fundament** ✓ abgeschlossen. Supabase live, Schema + RLS + Storage gepusht.
- **Phase 3 Seed-Import** ✓ abgeschlossen. Re-Seed v2 aus Auszahlungen-Sheet (11 STs inkl. ST11 19.02.26).
- **Phase 4 Next.js-Skeleton** ✓ abgeschlossen.
- **Phase 5 Frontend-Implementierung** ✓ **vollständig fertig**. Alle Read-Screens + Admin-Bereich (Login, Eingabe, Nächster, Spielerverwaltung) stehen mockup-treu. Spielabend-Lifecycle ist über die UI bedienbar.
- **Phase 6 Deploy + PWA** offen. Vercel + next-pwa + Service Worker + iPhone-Home-Screen-Icon. ~1–2 Std.

Realistische Schätzung: ~95 % des Gesamtwegs erledigt.

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

0. **BUG (Top-Prio): Deckblatt `/` zeigt „noch nicht geplant"** — `app/page.tsx` Zeile 37 filtert `is_closed=false`, aber alle STs sind closed. Fix: das `.eq("is_closed", false)` raus, dann ist jüngster ST mit `next_game_date` der Anker. ~5 Min.
1. **Phase 6: Vercel-Deploy + next-pwa + iPhone-Home-Screen-Icon** (Hauptfokus, ~1–2 Std).
2. **Bar-Chart visuell prüfen** mit ST 12 + 13 Daten (~10 Min).
3. **Storage-Bucket-Migration** beim nächsten Setup robuster machen.
4. **Erster echter Lifecycle-Test am 07.05.2026** — bis dahin keine Trockenläufe von "Spieltag abschließen", sonst landet ST 14 ungewollt in der DB.

## Supabase

- **Project URL:** `https://dcqsvquklwjfhmsfpodo.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/dcqsvquklwjfhmsfpodo
- **Project Ref:** `dcqsvquklwjfhmsfpodo`
- **Auth:** Frank (Email + Passwort) als einziger Admin-User. Andere User via Supabase Auth Dashboard, RLS authenticated-only schützt alle Schreib-Operationen.
- **Anon-Key, Service-Role-Key, NEXT_PUBLIC_SUPABASE_URL/ANON_KEY:** in `.env.local` (gitignored).
- **DB-Stand:** 13 game_days, alle is_closed=true. ST 13 (2026-04-16) ist jüngster, trägt next_game_date=2026-05-07 + next_game_planning für ST 14.
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
