"""Adhoc: Werner (rank 1) + Jens (rank 2) als Warteliste für offenen ST."""
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

gd = sb.table("game_days").select("id,played_on").eq("is_closed", False).execute().data[0]
print(f"offener ST: {gd['played_on']} ({gd['id']})")

players = {p["name"]: p["id"] for p in sb.table("players").select("id,name").execute().data}

rows = [
    {"game_day_id": gd["id"], "player_id": players["Werner"], "role": "waitlist", "waitlist_rank": 1},
    {"game_day_id": gd["id"], "player_id": players["Jens"],   "role": "waitlist", "waitlist_rank": 2},
]
sb.table("next_game_planning").upsert(rows).execute()
print(f"upserted: Werner=rank1, Jens=rank2")

check = sb.table("next_game_planning").select("role,waitlist_rank,players(name)").eq("game_day_id", gd["id"]).execute()
for r in check.data:
    print(f"  {r}")
