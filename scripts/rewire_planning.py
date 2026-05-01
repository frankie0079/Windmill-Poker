"""Verschiebt next_game_planning + next_game_date vom alten letzten Spieltag
auf den neuen letzten Spieltag.

Hintergrund: Die UI ("Naechster Spieltag") liest den juengsten game_day und
zeigt dessen next_game_planning. Nach Anlegen rueckwirkender STs (12, 13)
muss die Planung umgehaengt werden, sonst zeigt die UI weiterhin auf den
alten ST und das next_game_date.

Argumente:
    --from YYYY-MM-DD  (alter Trager)
    --to   YYYY-MM-DD  (neuer Trager)
    --next YYYY-MM-DD  (neues next_game_date am neuen Trager; alter wird NULL)
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env.local")

URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
sb = create_client(URL, SERVICE_KEY)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--from", dest="src", required=True)
    p.add_argument("--to", dest="dst", required=True)
    p.add_argument("--next", dest="next_date", required=True)
    args = p.parse_args()

    src = sb.table("game_days").select("id").eq("played_on", args.src).execute()
    dst = sb.table("game_days").select("id").eq("played_on", args.dst).execute()
    if not src.data:
        sys.exit(f"Quell-ST {args.src} nicht gefunden")
    if not dst.data:
        sys.exit(f"Ziel-ST {args.dst} nicht gefunden")
    src_id, dst_id = src.data[0]["id"], dst.data[0]["id"]

    # next_game_date umhaengen
    sb.table("game_days").update({"next_game_date": None}).eq("id", src_id).execute()
    sb.table("game_days").update({"next_game_date": args.next_date}).eq("id", dst_id).execute()
    print(f"OK next_game_date: {args.src} -> NULL, {args.dst} -> {args.next_date}")

    # planning umhaengen (nur falls nicht schon umgehaengt)
    existing_dst = sb.table("next_game_planning").select("player_id").eq("game_day_id", dst_id).execute()
    if existing_dst.data:
        sys.exit(f"Ziel-ST hat schon {len(existing_dst.data)} planning-Eintraege. Abbruch.")
    plan = sb.table("next_game_planning").select("player_id").eq("game_day_id", src_id).execute()
    if not plan.data:
        print(f"WARN keine planning auf {args.src} gefunden, nichts zu verschieben")
        return
    sb.table("next_game_planning").update({"game_day_id": dst_id}).eq("game_day_id", src_id).execute()
    print(f"OK {len(plan.data)} planning-Eintraege: {args.src} -> {args.dst}")


if __name__ == "__main__":
    main()
