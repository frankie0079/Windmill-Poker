# Session State — Windmill Poker

> Wird am Ende jeder Session aktualisiert. Beim Start als erstes lesen.

**Letzte Session:** 2026-04-29
**Branch:** `master` · **Letzter Commit:** `ce79012 "Windmill Poker - Mockup-Update + Spec-Erweiterung Phase 1.5"`

## Wo wir stehen

- **Phase 1 Design + 1.5 Mockup-Erweiterung** ✓ abgeschlossen.
- **Phase 2 Backend-Fundament** ✓ abgeschlossen. Supabase-Projekt live, Schema + RLS + Storage gepusht.
- **Phase 3 Seed-Import** offen. ~30 Min. Liest `Windmill_Poker_results_test.xlsx`, erzeugt INSERTs gegen Cloud-DB.
- **Phase 4 Next.js-Skeleton** offen. Routes, Components, Supabase-Client. ~1-2 Std.
- **Phase 5 Frontend-Implementierung** offen. Alle Screens echt. Mehrere Sessions.
- **Phase 6 Deploy + PWA** offen. ~1 Std.

Realistische Schätzung: ca. 25–30 % des Gesamtwegs erledigt.

## Heute erledigt (2026-04-29)

**Phase 1.5 — Mockup-Erweiterung:**
- Admin-Mockup neu strukturiert: 2 Sub-Tabs (Eingabe Spieltag / Nächster Spieltag), Spielerverwaltung als Sub-Screen
- Deckblatt-Mockup mit Countdown-Hero-Card + Teilnehmer-Button + Gallerie-FAB
- Teilnehmer-Liste-Screen (8 angemeldet + 3 Warteliste auf Plätzen 9–11)
- Gallerie + Foto-Detail mit Kommentar (Beispiel: "AA888 wird von 8888 geschlagen")
- Spieltage-Screen mit Status-Pill (Offen/Abgeschlossen) + scrollbarer Liste

**Spec-Update** (`docs/superpowers/specs/2026-04-27-poker-score-tracker-design.md`):
- `players.is_active` (Soft-Delete)
- `payouts NUMERIC(10,2)` mit ±2 Cent Toleranz
- `game_days.next_game_date` + `is_closed`
- Neue Tabellen: `next_game_planning`, `gallery_photos`
- Supabase Storage für Foto-Bucket
- Verhaltensregeln (Inaktive aus Rankings raus, Reaktivierung stellt Daten wieder her)

**Phase 2 — Backend-Fundament:**
- Scoop installiert, Supabase CLI v2.95.4 via scoop installiert
- `supabase init` im Repo, dann `supabase login` + `supabase link --project-ref dcqsvquklwjfhmsfpodo` + `supabase db push`
- 2 Migrations gepusht: `20260429152934_initial_schema.sql` (Tabellen + View + Indexes) + `20260429153420_rls_and_storage.sql` (RLS-Policies + Storage-Bucket)
- 6 Tabellen + View `moneylist` + Bucket `gallery-photos` (public) verifiziert
- `.env.local` gitignored hinzugefügt (Secrets-Schutz)

**Permissions optimiert:** `.claude/settings.json` mit 8 MCP-Playwright-Allowlist-Einträgen (Navigate, Screenshot, Snapshot, Click etc.)

## Offene Punkte für nächste Session

1. **Phase 3 Seed-Import** — Skript für 12 Spieltage aus Excel.
2. **Phase 4 Next.js-Skeleton starten** — `pnpm create next-app` oder `npx create-next-app`, Supabase-Client einrichten, erste Route.
3. **Storage-Bucket-Migration nachschärfen** — der INSERT in `storage.buckets` über die Migration hat erst beim manuellen Anlegen im Dashboard durchgegriffen. Beim nächsten Setup vermutlich wieder Reibung.

## ⚠️ Untracked-Files (parallele VS-Code-Session)

Diese Files sind nach wie vor untracked und gehören vermutlich zur parallelen Python-Session:

- `Coverbild_Poker.png`
- `build_mockups_final.py`
- `gen_spieler_profil.py`, `gen_spieler_profil_v2.py`, `_v3.py`, `_v4.py`
- `gen_spieltage_v2.py`, `gen_spieltage_v3.py`

**Nicht** `git add`en, **nicht** commiten, **nicht** löschen ohne Rückfrage.

## Supabase

- **Project URL:** `https://dcqsvquklwjfhmsfpodo.supabase.co` (in `.env.local`)
- **Dashboard:** https://supabase.com/dashboard/project/dcqsvquklwjfhmsfpodo
- **Project Ref:** `dcqsvquklwjfhmsfpodo`
- **CLI verlinkt:** ja, `supabase migration list --linked` zeigt beide Migrations gesynced
- **Anon-Key:** in `.env.local` (gitignored)
- **DB-Passwort:** kennt Frank (manuell beim Linken eingegeben)
- **Setup-Skript:** `setup-supabase.bat` im Repo-Root (idempotent für Re-Runs)

## Visual Companion

- **Server-Skript:** `C:\DEV\sandbox\superpowers-framework\skills\brainstorming\scripts\start-server.sh`
- **Start:** Bash-Tool mit `run_in_background: true`, Flag `--project-dir /c/DEV/sandbox/Superpowers-Trial_one`
- **Letzte Session-Dir:** `.superpowers/brainstorm/801-1777469477/` (am Sessionende stoppen)
- **Wichtig:** Server serviert immer die *neueste* Datei am Root-URL `/`. Mehrere Mockups übereinander in einer Datei (Stacked Frames) hat sich bewährt.

## Hinweis an mich (Claude)

Beim nächsten Start:
- Memory + dieser SESSION_STATE laden automatisch
- **Erst die Phase 3 Frage stellen:** Seed-Import jetzt oder Frontend-Skeleton zuerst?
- Frank ist bei Reibungspunkten allergisch — bei Permissions-Pop-ups, fehlenden Copy-Buttons, UI-Halluzinationen schnell zur Lösung springen statt zu raten
- Fragen IMMER via `AskUserQuestion` mit klickbaren Optionen — er hat das mehrfach explizit eingefordert
