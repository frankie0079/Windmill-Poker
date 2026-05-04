"""Diagnose: detaillierter State."""
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

print("=== game_days mit created_at ===")
gd = sb.table("game_days").select("id,played_on,is_closed,created_at").order("created_at").execute()
for g in gd.data:
    print(f"  {g['played_on']} closed={g['is_closed']} created={g['created_at']} id={g['id']}")

print("\n=== ALL planning ===")
plan = sb.table("next_game_planning").select("game_day_id,player_id,role,status,waitlist_rank,players(name,is_active)").execute()
for p in plan.data:
    print(f"  gd={p['game_day_id'][:8]} {p['players']['name']:8} role={p['role']:11} status={p['status']} rank={p['waitlist_rank']} active={p['players']['is_active']}")

print("\n=== ALL players (incl inactive) ===")
players = sb.table("players").select("id,name,is_active").execute()
for p in players.data:
    print(f"  {p['name']:10} active={p['is_active']} id={p['id']}")
