"use client";

import { useState, useTransition } from "react";
import { updateExcelBackup } from "./actions";

export function ExcelBackupButton({ configured }: { configured: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      setResult(await updateExcelBackup());
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending || !configured}
        className="font-oswald uppercase font-semibold"
        style={{
          width: "100%",
          padding: 11,
          background: configured ? "#E9B63A" : "#6A7575",
          color: "#0E1A1A",
          border: "2px solid #0E1A1A",
          borderRadius: 8,
          fontSize: 12,
          letterSpacing: "0.12em",
          cursor: pending ? "wait" : configured ? "pointer" : "not-allowed",
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? "Excel-Backup wird aktualisiert …" : "Excel-Backup aktualisieren"}
      </button>
      {!configured && (
        <div
          className="text-mist"
          style={{ fontSize: 10, textAlign: "center", marginTop: 5 }}
        >
          Google Drive ist noch nicht verbunden.
        </div>
      )}
      {result && (
        <div
          style={{
            marginTop: 6,
            padding: "7px 9px",
            border: `1px solid ${result.ok ? "#1E4A3C" : "#C94A2B"}`,
            color: result.ok ? "#1E4A3C" : "#C94A2B",
            fontSize: 11,
            textAlign: "center",
          }}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
