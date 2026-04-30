"""Cross-Check Excel <-> Cloud-DB nach Seed-Import.

Vergleicht zellgenau:
  - Spieltage (played_on aus rechter Seite)
  - Teilnehmer pro Spieltag (linke Seite, anwesend-Zeile)
  - Auszahlung pro (Spieltag, Spieler) (rechte Seite, Spieler|Betrag)

Bricht beim ersten Mismatch ab.
"""
from __future__ import annotations

import os
import sys
from decimal import Decimal
from pathlib import Path

import openpyxl
from dotenv import load_dotenv
from supabase import create_client

REPO_ROOT = Path(__file__).resolve().parent.parent

# Reuse parsing helpers from seed_import.
sys.path.insert(0, str(REPO_ROOT / "scripts"))
from seed_import import (  # noqa: E402
    EXCEL_PATH, SHEET_NAME,
    parse_attendees_left, parse_payout_blocks_right,
)


def main() -> int:
    print(f"Reading {EXCEL_PATH} ...")
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    ws = wb[SHEET_NAME]
    attendees_per_st = parse_attendees_left(ws)
    blocks = parse_payout_blocks_right(ws)
    for gd, att in zip(blocks, attendees_per_st):
        gd.attendees = att

    load_dotenv(REPO_ROOT / ".env.local")
    sb = create_client(os.environ["SUPABASE_URL"],
                       os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    # DB-Daten holen
    pl = {row["id"]: row["name"] for row in
          sb.table("players").select("id,name").execute().data}
    name_to_id = {v: k for k, v in pl.items()}

    gd_rows = sb.table("game_days").select("id,played_on").execute().data
    db_dates = {row["played_on"]: row["id"] for row in gd_rows}

    att_rows = sb.table("attendances").select("game_day_id,player_id").execute().data
    db_attendance: dict[str, set[str]] = {}
    for row in att_rows:
        db_attendance.setdefault(row["game_day_id"], set()).add(pl[row["player_id"]])

    rr_rows = sb.table("round_results").select(
        "game_day_id,player_id,payout"
    ).execute().data
    db_payouts: dict[tuple[str, str], Decimal] = {}
    for row in rr_rows:
        key = (row["game_day_id"], pl[row["player_id"]])
        db_payouts[key] = db_payouts.get(key, Decimal(0)) + Decimal(str(row["payout"]))

    errors: list[str] = []

    # 1) Spieltage
    excel_dates = {gd.played_on.isoformat() for gd in blocks}
    if excel_dates != set(db_dates.keys()):
        errors.append(f"Spieltag-Datums-Set unterschiedlich. "
                      f"Excel: {sorted(excel_dates)}, DB: {sorted(db_dates)}")

    # 2) Pro Spieltag: Teilnahme + Payout
    for gd in blocks:
        gd_id = db_dates.get(gd.played_on.isoformat())
        if gd_id is None:
            errors.append(f"{gd.played_on}: nicht in DB")
            continue

        # Teilnehmer
        excel_att = set(gd.attendees)
        db_att = db_attendance.get(gd_id, set())
        if excel_att != db_att:
            errors.append(
                f"{gd.played_on} Teilnehmer-Mismatch: "
                f"Excel={sorted(excel_att)}, DB={sorted(db_att)}, "
                f"nur Excel={sorted(excel_att - db_att)}, "
                f"nur DB={sorted(db_att - excel_att)}"
            )

        # Payout pro Spieler (Excel-Wert vs. DB-Summe pro Spieltag)
        for name in excel_att:
            excel_betrag = gd.payouts.get(name, Decimal(0))
            db_betrag = db_payouts.get((gd_id, name), Decimal(0))
            if excel_betrag != db_betrag:
                errors.append(
                    f"{gd.played_on} {name}: Excel={excel_betrag}EUR, "
                    f"DB={db_betrag}EUR"
                )

    # 3) Spieler-Liste
    excel_players = {n for gd in blocks for n in gd.attendees}
    db_players = set(name_to_id.keys())
    extra_db = db_players - excel_players
    missing = excel_players - db_players
    if missing:
        errors.append(f"Spieler in DB fehlend: {sorted(missing)}")
    # Extra-DB-Spieler sind ok (z.B. Martin könnte wenn auch leer dabei sein)

    # Output
    print()
    print("=" * 60)
    if errors:
        print(f"FEHLER ({len(errors)}):")
        for e in errors:
            print(f"  - {e}")
        return 1

    n_st = len(blocks)
    n_att = sum(len(gd.attendees) for gd in blocks)
    n_pay = sum(1 for gd in blocks for n in gd.attendees
                if gd.payouts.get(n, Decimal(0)) != 0)
    print("OK: Excel <-> DB sind zellgenau identisch.")
    print(f"  - {n_st} Spieltage")
    print(f"  - {len(excel_players)} aktive Spieler ({len(extra_db)} weitere in DB)")
    print(f"  - {n_att} Teilnahmen")
    print(f"  - {n_pay} Auszahlungs-Einträge mit Betrag > 0")
    return 0


if __name__ == "__main__":
    sys.exit(main())
