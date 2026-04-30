"use client";

import { useEffect, useState } from "react";

type Parts = { days: number; hours: number; mins: number };

function diff(target: Date): Parts {
  const ms = Math.max(0, target.getTime() - Date.now());
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  return { days, hours, mins };
}

export function Countdown({ targetIso }: { targetIso: string }) {
  // Server-render once, dann client-tick im Minutentakt.
  const target = new Date(targetIso);
  const [parts, setParts] = useState<Parts>(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setParts(diff(target)), 30_000);
    return () => clearInterval(id);
  }, [targetIso]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex justify-center" style={{ gap: 14, marginTop: 6 }}>
      <Block num={parts.days} unit="Tage" />
      <Sep />
      <Block num={parts.hours} unit="Std" />
      <Sep />
      <Block num={parts.mins} unit="Min" />
    </div>
  );
}

function Block({ num, unit }: { num: number; unit: string }) {
  return (
    <div
      className="flex flex-col items-center"
      style={{ minWidth: 50 }}
    >
      <div
        className="font-alfa text-cream"
        style={{ fontSize: 28, lineHeight: 1 }}
      >
        {num.toString().padStart(2, "0")}
      </div>
      <div
        className="font-oswald uppercase"
        style={{
          fontSize: 10,
          letterSpacing: "0.16em",
          color: "#E9B63A",
          marginTop: 4,
        }}
      >
        {unit}
      </div>
    </div>
  );
}

function Sep() {
  return (
    <div
      className="font-alfa self-center"
      style={{
        fontSize: 24,
        color: "rgba(242,231,206,0.4)",
        lineHeight: 1,
      }}
    >
      :
    </div>
  );
}
