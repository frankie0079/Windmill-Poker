import { PhoneFrame } from "@/components/PhoneFrame";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

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

type Detail = {
  player_id: string;
  name: string;
  total: number;
};

export default async function SpieltagePage() {
  const [gdRes, attRes, rrRes] = await Promise.all([
    supabase
      .from("game_days")
      .select("id,played_on,next_game_date,is_closed")
      .order("played_on", { ascending: false }),
    supabase
      .from("attendances")
      .select("game_day_id,player:players(id,name)"),
    supabase.from("round_results").select("game_day_id,player_id,payout"),
  ]);

  const gameDays = gdRes.data ?? [];
  const total = gameDays.length;
  const offen = gameDays.filter((r) => !r.is_closed).length;

  // Pro game_day_id -> liste der Detail-Rows (player + total)
  const detailsByGd = new Map<string, Detail[]>();
  type AttRow = {
    game_day_id: string;
    player: { id: string; name: string };
  };
  for (const a of (attRes.data ?? []) as unknown as AttRow[]) {
    if (!a.player) continue;
    const list = detailsByGd.get(a.game_day_id) ?? [];
    list.push({ player_id: a.player.id, name: a.player.name, total: 0 });
    detailsByGd.set(a.game_day_id, list);
  }
  for (const r of rrRes.data ?? []) {
    const list = detailsByGd.get(r.game_day_id);
    if (!list) continue;
    const item = list.find((x) => x.player_id === r.player_id);
    if (item) item.total += Number(r.payout);
  }
  // Pro Spieltag: höchsten Betrag merken (nur wenn eindeutig → Tagessieger).
  function tagessiegerId(rows: Detail[]): string | null {
    if (rows.length === 0) return null;
    const max = Math.max(...rows.map((r) => r.total));
    if (max <= 0) return null;
    const winners = rows.filter((r) => r.total === max);
    return winners.length === 1 ? winners[0].player_id : null;
  }

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
        ↕ scrollen für ältere Spieltage · auf Spieltag klicken für Details
      </div>

      <div
        className="overflow-y-auto scroll-warm"
        style={{ padding: "6px 10px 10px", maxHeight: 520 }}
      >
        {gameDays.map((gd, i) => {
          const stNum = total - i;
          const isOpen = !gd.is_closed;
          const bg = isOpen ? "#FFF8DC" : "#FFFCF4";
          const borderColor = isOpen ? "#E9B63A" : "#0E1A1A";
          const detail = (detailsByGd.get(gd.id) ?? []).slice().sort(
            (a, b) => b.total - a.total
          );
          const winnerId = tagessiegerId(detail);
          const playerCount = detail.length;

          return (
            <details
              key={gd.id}
              className="overflow-hidden group"
              style={{
                marginBottom: 8,
                borderRadius: 8,
                background: bg,
                border: `2px solid ${borderColor}`,
              }}
            >
              <summary
                className="font-oswald font-semibold text-ink flex justify-between items-center cursor-pointer"
                style={{
                  padding: "11px 14px",
                  fontSize: 14,
                  listStyle: "none",
                }}
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
                    {playerCount} Spieler
                    <span className="ml-1 group-open:hidden">▶</span>
                    <span className="ml-1 hidden group-open:inline">▼</span>
                  </span>
                </div>
              </summary>

              <div style={{ padding: "0 12px 12px" }}>
                {detail.length === 0 ? (
                  <div
                    className="text-mist italic"
                    style={{ fontSize: 11, padding: "4px 0 8px" }}
                  >
                    Noch keine Ergebnisse erfasst.
                  </div>
                ) : (
                  <table
                    className="w-full border-collapse"
                    style={{ fontSize: 12 }}
                  >
                    <thead>
                      <tr
                        className="font-oswald uppercase text-mist font-semibold text-left"
                        style={{ fontSize: 10, letterSpacing: "0.1em" }}
                      >
                        <th
                          style={{
                            padding: "4px 2px",
                            borderBottom: "2px solid rgba(14,26,26,0.35)",
                          }}
                        >
                          Spieler
                        </th>
                        <th
                          className="text-right"
                          style={{
                            padding: "4px 2px",
                            borderBottom: "2px solid rgba(14,26,26,0.35)",
                          }}
                        >
                          Gesamt
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.map((d, j) => {
                        const isLast = j === detail.length - 1;
                        const border = isLast
                          ? undefined
                          : "1px solid rgba(14,26,26,0.15)";
                        const isWinner = d.player_id === winnerId;
                        const valStyle: React.CSSProperties = isWinner
                          ? { color: "#C94A2B", fontWeight: 700 }
                          : d.total === 0
                          ? { color: "#6A7575" }
                          : {};
                        return (
                          <tr
                            key={d.player_id}
                            className="font-oswald font-semibold"
                            style={isWinner ? { color: "#C94A2B" } : undefined}
                          >
                            <td
                              style={{
                                padding: "5px 2px",
                                borderBottom: border,
                              }}
                            >
                              {d.name}
                            </td>
                            <td
                              className="text-right"
                              style={{
                                padding: "5px 2px",
                                borderBottom: border,
                                fontSize: 13,
                                ...valStyle,
                              }}
                            >
                              {eur.format(d.total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </PhoneFrame>
  );
}
