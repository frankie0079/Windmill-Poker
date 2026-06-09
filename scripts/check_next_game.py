"""Quick-check: was ist im DB-State für den offenen ST?"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env.local")

URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]

sb = create_client(URL, KEY)

gd = sb.table("game_days").select("id,played_on,is_closed").eq("is_closed", False).execute()
print("offene game_days:", gd.data)

if gd.data:
    gd_id = gd.data[0]["id"]
    att = sb.table("attendances").select("player_id,players(name)").eq("game_day_id", gd_id).execute()
    print(f"\nattendances ({len(att.data)}):")
    for a in att.data:
        print(f"  {a}")
    plan = sb.table("next_game_planning").select("player_id,role,players(name)").eq("game_day_id", gd_id).execute()
    print(f"\nnext_game_planning ({len(plan.data)}):")
    for p in plan.data:
        print(f"  {p}")
