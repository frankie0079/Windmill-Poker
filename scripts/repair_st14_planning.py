"""Einmalige Repair-Migration für ST 14 (2026-05-07).

Hintergrund: ST 14 wurde am 2026-05-01 mit dem alten closeAndStartNext angelegt,
das die next_game_planning-Rows von ST 13 löschte. Werner + Jens wurden danach
via add_waitlist.py manuell ergänzt, die 8 Participants fehlen aber.

Das neue Modell (State A) erwartet, dass das Planning den offenen ST komplett
beschreibt: 8 Participants (status=confirmed) plus die Warteliste. Dieses Skript
fügt die fehlenden Participant-Rows aus den vorhandenen attendances ein.

Idempotent: upsert auf (game_day_id, player_id).
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env.local")

URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
sb = create_client(URL, KEY)

gd = sb.table("game_days").select("id,played_on").eq("is_closed", False).execute().data
if not gd:
    print("Kein offener Spieltag — nichts zu reparieren.")
    raise SystemExit(0)
gd = gd[0]
print(f"offener ST: {gd['played_on']} ({gd['id']})")

att = sb.table("attendances").select("player_id,players(name)").eq("game_day_id", gd["id"]).execute().data
print(f"attendances: {len(att)}")

rows = [
    {
        "game_day_id": gd["id"],
        "player_id": a["player_id"],
        "role": "participant",
        "status": "confirmed",
        "waitlist_rank": None,
    }
    for a in att
]
sb.table("next_game_planning").upsert(rows, on_conflict="game_day_id,player_id").execute()
print(f"upserted {len(rows)} Participants als confirmed")

check = sb.table("next_game_planning").select("role,status,waitlist_rank,players(name)").eq("game_day_id", gd["id"]).execute().data
participants = [r for r in check if r["role"] == "participant"]
waitlist = sorted([r for r in check if r["role"] == "waitlist"], key=lambda r: r["waitlist_rank"] or 99)
print(f"\nResultat: {len(participants)} Participants + {len(waitlist)} Wartelistler")
for p in participants:
    print(f"  P  {p['players']['name']:8} status={p['status']}")
for w in waitlist:
    print(f"  W  {w['players']['name']:8} rank={w['waitlist_rank']}")
