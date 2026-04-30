import { PhoneFrame } from "@/components/PhoneFrame";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type GameDayRow = {
  id: string;
  played_on: string;
  next_game_date: string | null;
  is_closed: boolean;
  attendances: { count: number }[];
};

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function StatusPill({ isOpen }: { isOpen: boolean }) {
  if (isOpen) {
    return (
      <span
        className="inline-flex items-center font-oswald font-semibold uppercase whitespace-nowrap"
        style={{
          gap: 4,
          padding: "3px 8px",
          borderRadius: 10,
          fontSize: 10,
          letterSpacing: "0.1em",
          background: "#E9B63A",
          color: "#0E1A1A",
          border: "1px solid #0E1A1A",
        }}
      >
        🕐 Offen
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center font-oswald font-semibold uppercase whitespace-nowrap"
      style={{
        gap: 4,
        padding: "3px 8px",
        borderRadius: 10,
        fontSize: 10,
        letterSpacing: "0.1em",
        color: "#1E4A3C",
        border: "1px solid rgba(30,74,60,0.4)",
      }}
    >
      ✓ Abgeschlossen
    </span>
  );
}

export default async function SpieltagePage() {
  // attendances(count) gibt eine Aggregation pro Game-Day zurück (PostgREST embedded).
  const { data, error } = await supabase
    .from("game_days")
    .select("id,played_on,next_game_date,is_closed,attendances(count)")
    .order("played_on", { ascending: false });

  const rows = (data ?? []) as GameDayRow[];
  const total = rows.length;
  const offen = rows.filter((r) => !r.is_closed).length;

  return (
    <PhoneFrame activeTab="spieltage">
      <div
        className="flex items-baseline justify-between flex-shrink-0"
        style={{ padding: "10px 14px 4px" }}
      >
        <div className="font-alfa text-forest" style={{ fontSize: 17 }}>
          SPIELTAGE
        </div>
        <div
          className="font-oswald text-mist uppercase"
          style={{ fontSize: 11, letterSpacing: "0.08em" }}
        >
          {total} Spieltage · {offen} offen
        </div>
      </div>

      <div
        className="text-right font-oswald text-mist italic flex-shrink-0"
        style={{
          margin: "0 14px 6px 0",
          fontSize: 10,
          letterSpacing: "0.08em",
        }}
      >
        ↕ scrollen für ältere Spieltage
      </div>

      <div
        className="overflow-y-auto"
        style={{ padding: "6px 10px 10px", maxHeight: 520 }}
      >
        {error && (
          <pre className="text-rust text-xs p-2">{error.message}</pre>
        )}

        {rows.map((gd, i) => {
          const stNum = total - i;
          const playerCount = gd.attendances?.[0]?.count ?? 0;
          const isOpen = !gd.is_closed;
          const bg = isOpen ? "#FFF8DC" : "#FFFCF4";
          const borderColor = isOpen ? "#E9B63A" : "#0E1A1A";

          return (
            <div
              key={gd.id}
              className="overflow-hidden"
              style={{
                marginBottom: 8,
                borderRadius: 8,
                background: bg,
                border: `2px solid ${borderColor}`,
              }}
            >
              <button
                className="w-full bg-transparent font-oswald font-semibold text-ink flex justify-between items-center text-left"
                style={{ padding: "11px 14px", fontSize: 14, border: "none" }}
              >
                <div className="flex flex-col" style={{ gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {fmtDate(gd.played_on)} · ST {stNum}
                  </span>
                  {isOpen && gd.next_game_date && (
                    <span
                      className="font-work text-mist font-normal"
                      style={{ fontSize: 11, letterSpacing: "0.04em" }}
                    >
                      Nächster Spieltag: {fmtDate(gd.next_game_date)}
                    </span>
                  )}
                </div>
                <div className="flex items-center" style={{ gap: 8 }}>
                  <StatusPill isOpen={isOpen} />
                  <span
                    style={{
                      fontSize: 12,
                      color: isOpen ? "#0E1A1A" : "#6A7575",
                      fontWeight: isOpen ? 700 : 400,
                    }}
                  >
                    {playerCount} Spieler ▶
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </PhoneFrame>
  );
}
