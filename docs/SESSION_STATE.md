# Session State — Windmill Poker

> Wird am Ende jeder Session aktualisiert. Beim Start als erstes lesen.

**Letzte Session:** 2026-04-28
**Branch:** `master` · **Letzter Commit:** `f692799 "Windmill Poker - Design-Phase abgeschlossen"`

## Wo wir stehen

- **Phase 1 (Design) abgeschlossen.** Spec in `docs/superpowers/specs/2026-04-27-poker-score-tracker-design.md`. Mockups final unter `.superpowers/brainstorm/2619-1777306653/content/`.
- **Phase 2 (Backend-Fundament) geplant, nicht gestartet.** Konkret: Supabase-Setup → Schema-Migration → RLS → Seed-Import 12 Spieltage → Verifikation.

## Heute erledigt

- Memory-Bootstrap unter `~/.claude/projects/.../memory/` (User-Profil, Projekt-Status, Visual-Companion-Referenz).
- Visual-Companion neu gestartet, am Sessionende sauber gestoppt.
- Status-Screen mit Phase-2-Optionen A/B/C dem User gezeigt.
- `docs/SESSION_STATE.md` (diese Datei) angelegt.
- SessionStart-Hook in `.claude/settings.local.json` installiert.

## Offene Entscheidungen für nächste Session

1. **Phase-2-Reihenfolge** — Frank hat A/B/C noch nicht gewählt.
   - **A** (empfohlen): Strikt sequenziell — Supabase-Projekt → Schema → RLS → Seed → Verifikation.
   - **B**: Parallel — Schema + Next.js-Skeleton zusammen, Import als letzter Schritt.
   - **C**: Erst lokal mit Mock-Daten, Supabase ganz am Schluss.
2. **Supabase-Account** — existiert schon ein Projekt, oder fangen wir bei null an? (EU-Region, Free-Tier reicht für 11 Spieler.)
3. **Untracked Python-Skripte** — siehe Warnung unten. Klären: Behalten / committen / ignorieren?

## ⚠️ Wichtig: Parallele VS-Code-Chat-Session

Frank hat parallel ein VS-Code-Chat-Fenster offen, das Python-Code generiert. Die folgenden untracked Files im Working Tree gehören wahrscheinlich **nicht** zu unserer Arbeit, sondern zu der parallelen Session:

- `Coverbild_Poker.png`
- `build_mockups_final.py`
- `gen_spieler_profil.py`, `gen_spieler_profil_v2.py`, `_v3.py`, `_v4.py`
- `gen_spieltage_v2.py`, `gen_spieltage_v3.py`

**Nicht** `git add`en, **nicht** commiten, **nicht** löschen ohne Rückfrage. Erst Frank fragen, was der Stand der parallelen Arbeit ist.

## Visual Companion

- **Server-Skript:** `C:\DEV\sandbox\superpowers-framework\skills\brainstorming\scripts\start-server.sh`
- **Start (Windows, Claude Code):** Bash-Tool mit `run_in_background: true`, Flag `--project-dir /c/DEV/sandbox/Superpowers-Trial_one`.
- **Letzte Session-Dir:** `.superpowers/brainstorm/1758-1777395180/` (gestoppt).
- **Persistenz:** Mockups bleiben in `.superpowers/brainstorm/` über Restarts hinweg erhalten.

## Hinweis an mich (Claude)

Beim nächsten Start: Memory wird automatisch geladen, dieser SessionStart-Hook injiziert `git status` + diese Datei in den Kontext. Direkt mit "Wir hatten X offen — was willst du heute angehen?" einsteigen, nicht erst alles neu erkunden.
