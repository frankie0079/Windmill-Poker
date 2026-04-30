"""Legt ST 11 (16.04.2026, offen) an und plant ST 12 (07.05.2026) gemäß Mockup.

Hintergrund:
  - ST 11 wurde am 16.04.2026 gespielt, Ergebnisse werden später per Admin eingegeben.
    -> game_day mit is_closed=false, played_on=2026-04-16.
  - ST 12 ist der nächste geplante Spieltag am 07.05.2026 (Donnerstag, 19:15).
    -> ST 11.next_game_date = 2026-05-07.
  - Teilnehmer-Liste fix laut docs/mockups/deckblatt.html:
      Teilnehmer (8): Frank, Peter, Friedl, Jörg, Rainer, Jochen, Ciano, Werner
      Warteliste (3): Torben (Rang 1), Jens (Rang 2), Martin (Rang 3)
  - Martin wird neu als Spieler angelegt (war im Mockup, fehlte in den Excel-Seeds
    weil nie gespielt).

Idempotent: kann mehrfach laufen.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

REPO_ROOT = Path(__file__).resolve().parent.parent

ST11_PLAYED_ON = "2026-04-16"
ST12_DATE = "2026-05-07"
PARTICIPANTS = ["Frank", "Peter", "Friedl", "Jörg", "Rainer", "Jochen", "Ciano", "Torben"]
WAITLIST = [("Werner", 1), ("Jens", 2), ("Martin", 3)]


def main() -> int:
    load_dotenv(REPO_ROOT / ".env.local")
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    print("[1/4] Spieler-Liste sichern (Martin neu) ...")
    sb.table("players").upsert(
        [{"name": "Martin", "is_active": True}],
        on_conflict="name",
    ).execute()
    pl = {row["name"]: row["id"] for row in sb.table("players").select("id,name").execute().data}

    print(f"[2/4] ST 11 ({ST11_PLAYED_ON}) anlegen, is_closed=false, next_game_date={ST12_DATE} ...")
    sb.table("game_days").upsert(
        [{
            "played_on": ST11_PLAYED_ON,
            "is_closed": False,
            "next_game_date": ST12_DATE,
        }],
        on_conflict="played_on",
    ).execute()
    res = sb.table("game_days").select("id,played_on,is_closed,next_game_date").eq(
        "played_on", ST11_PLAYED_ON
    ).execute()
    st11_id = res.data[0]["id"]

    print("[3/4] next_game_planning fuer ST 11 neu schreiben ...")
    sb.table("next_game_planning").delete().eq("game_day_id", st11_id).execute()

    rows = []
    for name in PARTICIPANTS:
        rows.append({
            "game_day_id": st11_id,
            "player_id": pl[name],
            "role": "participant",
            "status": "confirmed",
            "waitlist_rank": None,
        })
    for name, rank in WAITLIST:
        rows.append({
            "game_day_id": st11_id,
            "player_id": pl[name],
            "role": "waitlist",
            "status": None,
            "waitlist_rank": rank,
        })
    sb.table("next_game_planning").insert(rows).execute()

    print("[4/4] Verifikation ...")
    res = sb.table("next_game_planning").select(
        "role,status,waitlist_rank,player_id"
    ).eq("game_day_id", st11_id).execute()
    by_role = {"participant": 0, "waitlist": 0}
    for r in res.data:
        by_role[r["role"]] += 1
    print(f"  ST 11 (offen): {by_role['participant']} Teilnehmer + {by_role['waitlist']} Warteliste")
    print(f"  next_game_date: {ST12_DATE}")

    print("Fertig.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
