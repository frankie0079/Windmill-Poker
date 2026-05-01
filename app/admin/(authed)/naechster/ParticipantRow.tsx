"use client";

import { useTransition } from "react";
import { setParticipantStatus } from "./actions";

export function ParticipantRow({
  gameDayId,
  playerId,
  name,
  status,
  isLast,
}: {
  gameDayId: string;
  playerId: string;
  name: string;
  status: "confirmed" | "cancelled";
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const cellBorder = isLast
    ? undefined
    : "1px solid rgba(14,26,26,0.12)";

  function toggle() {
    const next = status === "confirmed" ? "cancelled" : "confirmed";
    startTransition(async () => {
      await setParticipantStatus(gameDayId, playerId, next);
    });
  }

  const isCancelled = status === "cancelled";

  return (
    <tr>
      <td
        className="font-oswald font-semibold"
        style={{
          padding: "7px 0",
          borderBottom: cellBorder,
          textDecoration: isCancelled ? "line-through" : undefined,
          color: isCancelled ? "#6A7575" : undefined,
        }}
      >
        {name}
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
            background: isCancelled ? "rgba(201,74,43,0.15)" : "#1E4A3C",
            color: isCancelled ? "#C94A2B" : "#F2E7CE",
            border: isCancelled ? "1px solid #C94A2B" : "1px solid transparent",
          }}
        >
          {isCancelled ? "✗ Abgesagt" : "✓ Dabei"}
        </button>
      </td>
    </tr>
  );
}
