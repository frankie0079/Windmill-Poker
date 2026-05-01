"""Helper: legt einen offenen Spieltag + attendances an, oder schließt einen ST.

Anwendung (in der aktuellen Phase 5 nötig, weil "Spieltag abschließen"-Button
noch Stub ist und Frank rückwirkende STs (12, 13) über die Eingabe-UI
einpflegen will):

    # Anlegen ST 12 (offen)
    python scripts/admin_open_st.py open --date 2026-03-05 \
        --players "Frank,Peter,Friedl,Werner,Rainer,Jochen,Ciano,Jens"

    # Wenn Frank R1+R2 in der UI eingegeben hat, schließen:
    python scripts/admin_open_st.py close --date 2026-03-05

Service-Role-Key aus .env.local nötig (umgeht RLS).
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
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get(
    "SUPABASE_SERVICE_KEY"
)
if not SERVICE_KEY:
    sys.exit("SUPABASE_SERVICE_ROLE_KEY fehlt in .env.local")

sb = create_client(URL, SERVICE_KEY)


def cmd_open(date: str, player_names: list[str]) -> None:
    # Existiert ST schon?
    existing = sb.table("game_days").select("id, is_closed").eq("played_on", date).execute()
    if existing.data:
        sys.exit(
            f"ST am {date} existiert schon (id={existing.data[0]['id']}, "
            f"is_closed={existing.data[0]['is_closed']}). "
            f"Erst per 'close --date {date}' zumachen oder manuell loeschen."
        )

    # Player-IDs
    players = sb.table("players").select("id, name").in_("name", player_names).execute()
    found = {p["name"]: p["id"] for p in players.data}
    missing = [n for n in player_names if n not in found]
    if missing:
        sys.exit(f"Spieler nicht in DB gefunden: {missing}")

    # Insert game_day
    gd = sb.table("game_days").insert(
        {"played_on": date, "is_closed": False, "next_game_date": None}
    ).execute()
    game_day_id = gd.data[0]["id"]
    print(f"OK game_day angelegt: {date} id={game_day_id}")

    # Insert attendances
    rows = [{"game_day_id": game_day_id, "player_id": found[n]} for n in player_names]
    sb.table("attendances").insert(rows).execute()
    print(f"OK {len(rows)} attendances angelegt fuer {', '.join(player_names)}")


def cmd_close(date: str) -> None:
    existing = sb.table("game_days").select("id, is_closed").eq("played_on", date).execute()
    if not existing.data:
        sys.exit(f"Kein ST am {date} gefunden")
    row = existing.data[0]
    if row["is_closed"]:
        print(f"ST {date} ist bereits closed (id={row['id']})")
        return
    sb.table("game_days").update({"is_closed": True}).eq("id", row["id"]).execute()
    print(f"OK ST {date} geschlossen (id={row['id']})")


def cmd_delete(date: str) -> None:
    """Löscht einen ST komplett (CASCADE: attendances + round_results)."""
    existing = sb.table("game_days").select("id").eq("played_on", date).execute()
    if not existing.data:
        sys.exit(f"Kein ST am {date} gefunden")
    sb.table("game_days").delete().eq("id", existing.data[0]["id"]).execute()
    print(f"OK ST {date} geloescht (CASCADE: attendances + round_results)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_open = sub.add_parser("open", help="Offenen ST + attendances anlegen")
    p_open.add_argument("--date", required=True, help="YYYY-MM-DD")
    p_open.add_argument(
        "--players",
        required=True,
        help='Komma-getrennt, z.B. "Frank,Peter,Friedl"',
    )

    p_close = sub.add_parser("close", help="ST is_closed=true setzen")
    p_close.add_argument("--date", required=True, help="YYYY-MM-DD")

    p_del = sub.add_parser("delete", help="ST + alle abh. Daten LOESCHEN")
    p_del.add_argument("--date", required=True, help="YYYY-MM-DD")

    args = parser.parse_args()
    if args.cmd == "open":
        cmd_open(args.date, [n.strip() for n in args.players.split(",")])
    elif args.cmd == "close":
        cmd_close(args.date)
    elif args.cmd == "delete":
        cmd_delete(args.date)


if __name__ == "__main__":
    main()
