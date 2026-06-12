"use client";

import { useTransition } from "react";
import { setActualAttendance } from "./actions";

export function ActualAttendanceRow({
  gameDayId,
  playerId,
  name,
  present,
  roleLabel,
  isLast,
}: {
  gameDayId: string;
  playerId: string;
  name: string;
  present: boolean;
  roleLabel: string;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const cellBorder = isLast
    ? undefined
    : "1px solid rgba(14,26,26,0.12)";

  function toggle() {
    startTransition(async () => {
      await setActualAttendance(gameDayId, playerId, !present);
    });
  }

  return (
    <tr>
      <td
        className="font-oswald font-semibold"
        style={{
          padding: "7px 0",
          borderBottom: cellBorder,
          color: present ? "#0E1A1A" : "#6A7575",
          textDecoration: present ? undefined : "line-through",
        }}
      >
        {name}
        <span
          className="font-oswald uppercase"
          style={{
            display: "inline-block",
            marginLeft: 7,
            fontSize: 9,
            letterSpacing: "0.08em",
            color: "#6A7575",
          }}
        >
          {roleLabel}
        </span>
      </td>
      <td
        style={{
          padding: "7px 0",
          borderBottom: cellBorder,
          textAlign: "right",
        }}
      >
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className="font-oswald uppercase font-semibold"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "3px 8px",
            borderRadius: 10,
            fontSize: 10,
            letterSpacing: "0.1em",
            cursor: pending ? "wait" : "pointer",
            background: present ? "#1E4A3C" : "rgba(201,74,43,0.15)",
            color: present ? "#F2E7CE" : "#C94A2B",
            border: present ? "1px solid transparent" : "1px solid #C94A2B",
          }}
        >
          {present ? "da" : "nicht da"}
        </button>
      </td>
    </tr>
  );
}
