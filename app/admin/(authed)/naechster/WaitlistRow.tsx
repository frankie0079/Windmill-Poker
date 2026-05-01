"use client";

import { useTransition } from "react";
import { setWaitlistRank } from "./actions";

export function WaitlistRow({
  gameDayId,
  playerId,
  name,
  rank,
  promoted,
  isLast,
}: {
  gameDayId: string;
  playerId: string;
  name: string;
  rank: 1 | 2 | 3;
  promoted: boolean; // true wenn dieser Rang eine offene Stelle nachrückt
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const cellBorder = isLast
    ? undefined
    : "1px solid rgba(14,26,26,0.12)";

  function changeRank(next: number) {
    const r = next as 1 | 2 | 3;
    startTransition(async () => {
      await setWaitlistRank(gameDayId, playerId, r);
    });
  }

  const isRank1 = rank === 1;

  return (
    <tr>
      <td
        className="font-oswald font-semibold"
        style={{ padding: "7px 0", borderBottom: cellBorder }}
      >
        <span
          className="font-oswald font-semibold"
          style={{
            display: "inline-block",
            width: 18,
            height: 18,
            lineHeight: "18px",
            textAlign: "center",
            borderRadius: "50%",
            fontSize: 10,
            marginRight: 8,
            verticalAlign: "middle",
            background: isRank1 ? "#C94A2B" : "#E8D9B5",
            color: isRank1 ? "#F2E7CE" : "#0E1A1A",
          }}
        >
          {rank}
        </span>
        {name}
      </td>
      <td
        style={{
          padding: "7px 0",
          borderBottom: cellBorder,
          textAlign: "right",
        }}
      >
        {promoted ? (
          <span
            className="font-oswald uppercase font-semibold"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 10,
              fontSize: 10,
              letterSpacing: "0.1em",
              background: "#E9B63A",
              color: "#0E1A1A",
            }}
          >
            ↑ rückt nach
          </span>
        ) : (
          <select
            value={rank}
            onChange={(e) => changeRank(Number(e.target.value))}
            disabled={pending}
            className="font-oswald"
            style={{
              padding: "4px 8px",
              fontSize: 11,
              background: "#F2E7CE",
              color: "#0E1A1A",
              border: "2px solid #0E1A1A",
              borderRadius: 6,
              outline: "none",
              cursor: pending ? "wait" : "pointer",
            }}
          >
            <option value={1}>Rang 1</option>
            <option value={2}>Rang 2</option>
            <option value={3}>Rang 3</option>
          </select>
        )}
      </td>
    </tr>
  );
}
