"use client";

import { useState, useTransition } from "react";
import { updateNextGameDate } from "./actions";

export function DateInput({
  gameDayId,
  initial,
}: {
  gameDayId: string;
  initial: string; // YYYY-MM-DD
}) {
  const [value, setValue] = useState(initial);
  const [pending, startTransition] = useTransition();

  function handleChange(next: string) {
    setValue(next);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) return;
    startTransition(async () => {
      await updateNextGameDate(gameDayId, next);
    });
  }

  return (
    <div
      style={{
        margin: "6px 14px 6px",
        padding: "10px 12px",
        background: "rgba(255,255,255,0.4)",
        border: "2px solid #0E1A1A",
        borderRadius: 8,
      }}
    >
      <div
        className="font-oswald uppercase text-mist"
        style={{
          fontSize: 10,
          letterSpacing: "0.12em",
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        Datum {pending && "· speichere …"}
      </div>
      <div className="flex items-center" style={{ gap: 10 }}>
        <span style={{ fontSize: 18 }}>📅</span>
        <input
          type="date"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="font-oswald"
          style={{
            flex: 1,
            padding: "6px 8px",
            fontSize: 14,
            fontWeight: 600,
            background: "#F2E7CE",
            color: "#0E1A1A",
            border: "2px solid #0E1A1A",
            borderRadius: 6,
            outline: "none",
          }}
        />
        <span
          className="font-oswald text-mist"
          style={{ fontSize: 11 }}
        >
          19:15
        </span>
      </div>
    </div>
  );
}
