"use client";

import { useTransition } from "react";
import { togglePlayerActive, deletePlayer } from "./actions";

export function PlayerRow({
  id,
  name,
  isActive,
  gameDays,
  isLast,
}: {
  id: string;
  name: string;
  isActive: boolean;
  gameDays: number;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const cellBorder = isLast
    ? undefined
    : "1px solid rgba(14,26,26,0.12)";
  const rowOpacity = isActive ? 1 : 0.55;

  function handleToggle() {
    startTransition(async () => {
      await togglePlayerActive(id, !isActive);
    });
  }

  function handleDelete() {
    const msg =
      gameDays > 0
        ? `"${name}" löschen? Damit gehen ${gameDays} Spieltag-Ergebnisse unwiderruflich verloren!`
        : `"${name}" löschen?`;
    if (!window.confirm(msg)) return;
    startTransition(async () => {
      await deletePlayer(id);
    });
  }

  return (
    <tr style={{ opacity: rowOpacity }}>
      <td
        className="font-oswald font-semibold"
        style={{
          padding: "8px 0",
          borderBottom: cellBorder,
          textDecoration: isActive ? undefined : "line-through",
        }}
      >
        {name}
      </td>
      <td
        style={{
          padding: "8px 0",
          borderBottom: cellBorder,
          textAlign: "center",
        }}
      >
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          aria-label={isActive ? "Deaktivieren" : "Aktivieren"}
          style={{
            display: "inline-block",
            width: 34,
            height: 18,
            borderRadius: 9,
            position: "relative",
            verticalAlign: "middle",
            border: "none",
            padding: 0,
            cursor: pending ? "wait" : "pointer",
            background: isActive ? "#1E4A3C" : "#C9C0AC",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              width: 14,
              height: 14,
              background: "#F2E7CE",
              borderRadius: "50%",
              left: isActive ? undefined : 2,
              right: isActive ? 2 : undefined,
            }}
          />
        </button>
      </td>
      <td
        className="font-oswald"
        style={{
          padding: "8px 0",
          borderBottom: cellBorder,
          textAlign: "right",
          fontSize: 12,
        }}
      >
        {gameDays}
      </td>
      <td
        style={{
          padding: "8px 0",
          borderBottom: cellBorder,
          textAlign: "right",
          width: 32,
        }}
      >
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          aria-label="Löschen"
          style={{
            background: "transparent",
            border: "none",
            color: "#C94A2B",
            fontSize: 16,
            cursor: pending ? "wait" : "pointer",
            padding: 0,
          }}
        >
          🗑
        </button>
      </td>
    </tr>
  );
}
