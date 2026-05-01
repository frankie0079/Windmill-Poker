"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { saveRound } from "./actions";

type Attendee = { id: string; name: string };
type ExistingByRound = { 1: Map<string, number>; 2: Map<string, number> };

const eur2 = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function parseDe(input: string): number {
  if (!input) return 0;
  const norm = input.replace(/\s/g, "").replace(",", ".");
  const n = Number(norm);
  return Number.isFinite(n) ? n : 0;
}

function initialState(att: Attendee[], saved: Map<string, number>) {
  const out: Record<string, string> = {};
  for (const a of att) {
    const v = saved.get(a.id);
    out[a.id] = v != null ? v.toFixed(2).replace(".", ",") : "";
  }
  return out;
}

export function EingabeForm({
  gameDayId,
  playedOnLabel,
  attendees,
  existing,
  initialActive,
}: {
  gameDayId: string;
  playedOnLabel: string;
  attendees: Attendee[];
  existing: ExistingByRound;
  initialActive: 1 | 2;
}) {
  const initialR1 = useMemo(
    () => initialState(attendees, existing[1]),
    [attendees, existing],
  );
  const initialR2 = useMemo(
    () => initialState(attendees, existing[2]),
    [attendees, existing],
  );
  const [active, setActive] = useState<1 | 2>(initialActive);
  const [round1, setRound1] = useState<Record<string, string>>(initialR1);
  const [round2, setRound2] = useState<Record<string, string>>(initialR2);
  const [pending, startTransition] = useTransition();
  const [savedFlash, setSavedFlash] = useState<1 | 2 | null>(null);
  const [sessionSaved, setSessionSaved] = useState<Set<1 | 2>>(new Set());
  const router = useRouter();

  const current = active === 1 ? round1 : round2;
  const setCurrent = active === 1 ? setRound1 : setRound2;
  const initialCurrent = active === 1 ? initialR1 : initialR2;

  const r1HasData = existing[1].size > 0;
  const r2HasData = existing[2].size > 0;
  const r1Done = r1HasData || savedFlash === 1;
  const r2Done = r2HasData || savedFlash === 2;
  const bothSaved = r1Done && r2Done;

  const isDirty = (cur: Record<string, string>, init: Record<string, string>) =>
    attendees.some((a) => (cur[a.id] ?? "") !== (init[a.id] ?? ""));
  const dirtyCurrent = isDirty(current, initialCurrent);
  const currentHasSaved = active === 1 ? r1Done : r2Done;

  const numericPayouts = useMemo(
    () => attendees.map((a) => ({ id: a.id, value: parseDe(current[a.id] ?? "") })),
    [attendees, current],
  );
  const sum = numericPayouts.reduce((s, p) => s + p.value, 0);
  const target = attendees.length * 20;
  const diff = sum - target;
  const ok = Math.abs(diff) <= 0.02;

  // Top-Highlight pro Runde = höchste Auszahlung > 0. Bei Tie alle markieren
  // (häufig teilen sich die ersten 2 Plätze den Topf — beide rot).
  const max = numericPayouts.reduce(
    (m, p) => (p.value > m ? p.value : m),
    0,
  );
  const isTop = (v: number) => v > 0 && v === max;

  function handleChange(playerId: string, raw: string) {
    setCurrent((prev) => ({ ...prev, [playerId]: raw }));
  }

  function handleSave() {
    const payouts = numericPayouts.map((p) => ({
      playerId: p.id,
      payout: Math.round(p.value * 100) / 100,
    }));
    startTransition(async () => {
      await saveRound(gameDayId, active, payouts);
      const nextSaved = new Set(sessionSaved);
      nextSaved.add(active);
      setSessionSaved(nextSaved);
      const r1Final = r1HasData || nextSaved.has(1);
      const r2Final = r2HasData || nextSaved.has(2);
      // Beide Runden komplett -> direkt zur Naechster-Spieltag-Planung.
      if (r1Final && r2Final) {
        router.push("/admin/naechster");
        return;
      }
      setSavedFlash(active);
      setTimeout(() => setSavedFlash(null), 2000);
    });
  }

  return (
    <>
      {/* Tab-Switch R1/R2 */}
      <div
        className="flex font-oswald uppercase font-semibold"
        style={{
          margin: "6px 14px",
          fontSize: 12,
          letterSpacing: "0.1em",
          borderBottom: "2px solid rgba(14,26,26,0.2)",
        }}
      >
        {([1, 2] as const).map((r) => {
          const isActive = r === active;
          const done = r === 1 ? r1Done : r2Done;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setActive(r)}
              style={{
                padding: "6px 12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: isActive ? "#C94A2B" : "#6A7575",
                borderBottom: isActive ? "3px solid #C94A2B" : "none",
                marginBottom: -2,
                fontFamily: "inherit",
                fontWeight: "inherit",
                fontSize: "inherit",
                letterSpacing: "inherit",
                textTransform: "inherit",
              }}
            >
              {r}. Runde {done && "✓"}
            </button>
          );
        })}
      </div>

      {/* Spielerliste */}
      <div style={{ padding: "6px 14px 4px" }}>
        <table className="w-full border-collapse" style={{ fontSize: 13 }}>
          <thead>
            <tr
              className="font-oswald uppercase text-mist font-semibold"
              style={{ fontSize: 10, letterSpacing: "0.12em" }}
            >
              <th
                style={{
                  padding: "5px 0",
                  borderBottom: "1px solid rgba(14,26,26,0.25)",
                  textAlign: "left",
                }}
              >
                Spieler
              </th>
              <th
                style={{
                  padding: "5px 0",
                  borderBottom: "1px solid rgba(14,26,26,0.25)",
                  textAlign: "right",
                }}
              >
                Auszahlung
              </th>
            </tr>
          </thead>
          <tbody>
            {attendees.map((a, i) => {
              const raw = current[a.id] ?? "";
              const value = parseDe(raw);
              const top = isTop(value);
              const isZero = value === 0;
              const cellBorder = i === 0 ? undefined : "1px dashed rgba(14,26,26,0.12)";
              return (
                <tr key={a.id}>
                  <td
                    className="font-oswald font-semibold"
                    style={{
                      padding: "7px 0",
                      borderTop: cellBorder,
                      color: isZero ? "#6A7575" : undefined,
                    }}
                  >
                    {a.name}
                  </td>
                  <td
                    style={{
                      padding: "7px 0",
                      borderTop: cellBorder,
                      textAlign: "right",
                    }}
                  >
                    <input
                      type="text"
                      inputMode="decimal"
                      value={raw}
                      onChange={(e) => handleChange(a.id, e.target.value)}
                      placeholder="0"
                      className="font-oswald font-semibold text-right"
                      style={{
                        width: 78,
                        padding: "4px 6px",
                        fontSize: top ? 14 : 13,
                        background: "#F2E7CE",
                        border: "2px solid #0E1A1A",
                        borderRadius: 6,
                        outline: "none",
                        color: top
                          ? "#C94A2B"
                          : isZero
                            ? "#6A7575"
                            : "#0E1A1A",
                        fontWeight: top ? 700 : 600,
                      }}
                    />
                    <span
                      className="font-oswald"
                      style={{
                        marginLeft: 4,
                        fontSize: 12,
                        color: top
                          ? "#C94A2B"
                          : isZero
                            ? "#6A7575"
                            : undefined,
                        fontWeight: top ? 700 : undefined,
                      }}
                    >
                      €
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pott-Check */}
      <div
        style={{
          margin: "8px 14px 6px",
          padding: "10px 12px",
          background: ok ? "rgba(30,74,60,0.10)" : "rgba(201,74,43,0.10)",
          border: `2px solid ${ok ? "#1E4A3C" : "#C94A2B"}`,
          borderRadius: 8,
        }}
      >
        <div
          className="flex justify-between items-center"
          style={{ marginBottom: 4 }}
        >
          <span
            className="font-oswald uppercase font-semibold"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: ok ? "#1E4A3C" : "#C94A2B",
            }}
          >
            Pott-Check
          </span>
          <span
            className="font-oswald"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: ok ? "#1E4A3C" : "#C94A2B",
            }}
          >
            {ok ? "✓ OK" : "⚠ Differenz"}
          </span>
        </div>
        <div
          className="flex justify-between font-oswald"
          style={{ fontSize: 12 }}
        >
          <span>Summe Auszahlung</span>
          <span style={{ fontWeight: 600 }}>{eur2.format(sum)}</span>
        </div>
        <div
          className="flex justify-between font-oswald"
          style={{ fontSize: 12 }}
        >
          <span>Soll ({attendees.length} × 20€)</span>
          <span style={{ fontWeight: 600 }}>{eur2.format(target)}</span>
        </div>
        <div
          className="flex justify-between font-oswald"
          style={{
            fontSize: 12,
            color: ok ? "#1E4A3C" : "#C94A2B",
            marginTop: 2,
            paddingTop: 4,
            borderTop: `1px dashed ${ok ? "rgba(30,74,60,0.4)" : "rgba(201,74,43,0.4)"}`,
          }}
        >
          <span>Differenz</span>
          <span style={{ fontWeight: 700 }}>
            {diff >= 0 ? "+" : ""}
            {eur2.format(diff)}{" "}
            <span
              className="text-mist"
              style={{ fontSize: 10, fontWeight: 400 }}
            >
              ({ok ? "innerhalb ±2¢" : "außerhalb ±2¢"})
            </span>
          </span>
        </div>
      </div>

      <div
        className="text-mist italic"
        style={{
          margin: "0 14px 8px",
          fontSize: 11,
          lineHeight: 1.4,
        }}
      >
        Toleranz bis ±2 Cent erlaubt geteilte Plätze (z.B. 3× 6,66€ statt 20€).
      </div>

      {bothSaved && !dirtyCurrent && (
        <div
          style={{
            margin: "0 14px 6px",
            padding: "10px 12px",
            background: "rgba(30,74,60,0.10)",
            border: "2px solid #1E4A3C",
            borderRadius: 8,
            textAlign: "center",
          }}
        >
          <span
            className="font-oswald text-forest"
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            ✓ Spieltag {playedOnLabel} vollst&auml;ndig erfasst
          </span>
        </div>
      )}

      <div style={{ padding: "6px 14px 14px" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="font-oswald uppercase font-semibold"
          style={{
            width: "100%",
            padding: 13,
            background: "#1E4A3C",
            color: "#F2E7CE",
            border: "2px solid #0E1A1A",
            borderRadius: 8,
            fontSize: 13,
            letterSpacing: "0.14em",
            cursor: pending ? "wait" : "pointer",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending
            ? "Speichere …"
            : savedFlash === active
              ? `✓ Runde ${active} gespeichert`
              : currentHasSaved && !dirtyCurrent
                ? `✓ Runde ${active} gespeichert`
                : currentHasSaved
                  ? `Runde ${active} aktualisieren`
                  : `Runde ${active} speichern`}
        </button>
      </div>
    </>
  );
}
