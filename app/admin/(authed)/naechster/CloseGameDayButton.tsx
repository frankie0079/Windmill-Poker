"use client";

import { useTransition } from "react";
import { closeAndStartNext } from "./actions";

export function CloseGameDayButton({
  gameDayId,
  disabledReason,
}: {
  gameDayId: string;
  disabledReason: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (disabledReason) {
      window.alert(disabledReason);
      return;
    }
    startTransition(async () => {
      await closeAndStartNext(gameDayId);
    });
  }

  const isDisabled = pending || Boolean(disabledReason);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="font-oswald uppercase font-semibold"
      style={{
        width: "100%",
        padding: 13,
        background: isDisabled ? "#6A7575" : "#1E4A3C",
        color: "#F2E7CE",
        border: "2px solid #0E1A1A",
        borderRadius: 8,
        fontSize: 13,
        letterSpacing: "0.14em",
        cursor: pending ? "wait" : isDisabled ? "not-allowed" : "pointer",
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? "Schließe Spieltag …" : "Spieltag abschließen"}
    </button>
  );
}
