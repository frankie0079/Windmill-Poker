# Session State — Windmill Poker

> Wird am Ende jeder Session aktualisiert. Beim Start als erstes lesen.

**Letzte Session:** 2026-04-30
**Branch:** `master` · **Letzter Commit:** wird nach diesem Commit aktualisiert (Phase 3 — Seed-Import + Moneylist-Bugfix)

## Wo wir stehen

- **Phase 1 Design + 1.5 Mockup-Erweiterung** ✓ abgeschlossen.
- **Phase 2 Backend-Fundament** ✓ abgeschlossen. Supabase-Projekt live, Schema + RLS + Storage gepusht.
- **Phase 3 Seed-Import** ✓ abgeschlossen. 10 Spieltage aus Test-Excel in Cloud-DB, moneylist-View matcht Excel-Rangliste zellgenau.
- **Phase 4 Next.js-Skeleton** offen. Routes, Components, Supabase-Client. ~1-2 Std.
- **Phase 5 Frontend-Implementierung** offen. Alle Screens echt. Mehrere Sessions.
- **Phase 6 Deploy + PWA** offen. ~1 Std.

Realistische Schätzung: ca. 35 % des Gesamtwegs erledigt.

## Heute erledigt (2026-04-30)

**Phase 3 — Seed-Import:**
- `scripts/seed_import.py` parst rechte Seite (Spieler/Betrag pro ST) + linke Seite (anwesend für Teilnehmerliste, deckt 0-EUR-Spieltage ab). Idempotent via Upsert.
- `scripts/verify_seed.py` cross-checkt Excel ↔ Cloud-DB zellgenau (10 STs, 10 Spieler, 74 Teilnahmen, 57 Auszahlungen mit Betrag > 0). Match!
- `scripts/requirements.txt` (openpyxl, supabase, python-dotenv).
- `.env.local` um `SUPABASE_SERVICE_ROLE_KEY` ergänzt (gitignored).

**Bugfix — moneylist-View:**
- Migration `20260430153837_fix_moneylist_view.sql`: kartesisches Produkt zwischen `attendances` und `round_results` korrigiert (Pre-Aggregation per Subquery). Vorher waren totals 10× zu hoch.
- moneylist-Werte jetzt 1:1 wie Excel-Rangliste R102+ und Avg-Rangliste R117+.

**Untracked-Files (parallele VS-Code-Session) gelöscht** (auf Anweisung):
- `Coverbild_Poker.png`, `build_mockups_final.py`, `gen_spieler_profil.py` + v2/v3/v4, `gen_spieltage_v2.py`, `gen_spieltage_v3.py`.

**Lessons:**
- Beim Schema-Design Views immer mit Test-Daten verifizieren — der attendances/round_results-Cross-Join war im leeren Schema nicht sichtbar.
- Beim Excel-Parsing Domain-Modell zuerst klären (hier: nur Geld pro Spieltag, keine Per-Runde-Splits) — hat einen halben Anlauf gespart, als ich das verstand.

## Erledigt 2026-04-29

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

1. **Phase 4 Next.js-Skeleton starten** — `pnpm create next-app` oder `npx create-next-app`, Supabase-Client einrichten, erste Route gegen `moneylist`.
2. **Storage-Bucket-Migration nachschärfen** — der INSERT in `storage.buckets` über die Migration hat erst beim manuellen Anlegen im Dashboard durchgegriffen. Beim nächsten Setup vermutlich wieder Reibung.
3. **Test-Excel hat nur 10 STs**, Spec spricht von 12. Wenn echte Daten kommen, `seed_import.py` ist generisch — sollte ohne Anpassung weitere Blöcke schlucken.

## Supabase

- **Project URL:** `https://dcqsvquklwjfhmsfpodo.supabase.co` (in `.env.local`)
- **Dashboard:** https://supabase.com/dashboard/project/dcqsvquklwjfhmsfpodo
- **Project Ref:** `dcqsvquklwjfhmsfpodo`
- **CLI verlinkt:** ja, `supabase migration list --linked` zeigt alle 3 Migrations gesynced (initial_schema, rls_and_storage, fix_moneylist_view)
- **Anon-Key:** in `.env.local` (gitignored)
- **Service-Role-Key:** in `.env.local` (gitignored, wird vom Seed-Skript für RLS-Bypass beim Schreiben gebraucht)
- **DB-Passwort:** kennt Frank (manuell beim Linken eingegeben)
- **Setup-Skript:** `setup-supabase.bat` im Repo-Root (idempotent für Re-Runs)
- **Seed-Skript:** `python scripts/seed_import.py` (idempotent, `--dry-run` für Vorschau ohne Write)

## Visual Companion

- **Server-Skript:** `C:\DEV\sandbox\superpowers-framework\skills\brainstorming\scripts\start-server.sh`
- **Start:** Bash-Tool mit `run_in_background: true`, Flag `--project-dir /c/DEV/sandbox/Superpowers-Trial_one`
- **Letzte Session-Dir:** `.superpowers/brainstorm/801-1777469477/` (am Sessionende stoppen)
- **Wichtig:** Server serviert immer die *neueste* Datei am Root-URL `/`. Mehrere Mockups übereinander in einer Datei (Stacked Frames) hat sich bewährt.

## Hinweis an mich (Claude)

Beim nächsten Start:
- Memory + dieser SESSION_STATE laden automatisch
- **Phase 4 Frage stellen:** Frontend-Skeleton mit `pnpm create next-app` jetzt? Routing-Plan + Supabase-Client zuerst, oder direkt Mock-Komponenten porten?
- Frank ist bei Reibungspunkten allergisch — bei Permissions-Pop-ups, fehlenden Copy-Buttons, UI-Halluzinationen schnell zur Lösung springen statt zu raten
- Fragen IMMER via `AskUserQuestion` mit klickbaren Optionen — er hat das mehrfach explizit eingefordert
- Wenn ich auf eine Aktion vom User warte (Key, Push-Confirm, etc.): **explizit als ersten Satz** sagen "ich pausiere", nicht beiläufig am Ende — Frank hat das eingefordert
