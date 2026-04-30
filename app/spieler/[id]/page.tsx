import Link from "next/link";
import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const eur0 = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function fmtDateShort(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y.slice(2)}`;
}

export default async function SpielerProfil({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: player } = await supabase
    .from("players")
    .select("id,name,is_active")
    .eq("id", id)
    .single();
  if (!player || !player.is_active) notFound();

  const { data: ml } = await supabase
    .from("moneylist")
    .select("id,name,total_winnings,game_days_played,avg_per_gameday")
    .order("total_winnings", { ascending: false });
  const moneyRows = ml ?? [];
  const rankMoney = moneyRows.findIndex((r) => r.id === id) + 1;
  const avgSorted = [...moneyRows].sort(
    (a, b) => b.avg_per_gameday - a.avg_per_gameday
  );
  const rankAvg = avgSorted.findIndex((r) => r.id === id) + 1;
  const stats = moneyRows.find((r) => r.id === id);

  // Spieltage des Spielers + Tagessieg-Erkennung
  const { data: rr } = await supabase
    .from("round_results")
    .select("payout,player_id,game_day:game_days(id,played_on)")
    .order("game_day(played_on)", { ascending: false });

  type RR = {
    payout: number;
    player_id: string;
    game_day: { id: string; played_on: string };
  };
  const all = (rr ?? []) as unknown as RR[];

  // Pro game_day_id: gesamt-payout pro Spieler -> Tagessieger ermitteln
  const sums = new Map<string, Map<string, number>>(); // gd_id -> player_id -> total
  for (const r of all) {
    if (!r.game_day) continue;
    const m = sums.get(r.game_day.id) ?? new Map<string, number>();
    m.set(r.player_id, (m.get(r.player_id) ?? 0) + Number(r.payout));
    sums.set(r.game_day.id, m);
  }

  type Row = { id: string; played_on: string; total: number; sieg: boolean };
  const playerRows: Row[] = [];
  const playerGameDayIds = new Set<string>();
  for (const r of all) {
    if (!r.game_day || r.player_id !== id) continue;
    if (playerGameDayIds.has(r.game_day.id)) continue;
    playerGameDayIds.add(r.game_day.id);
    const totalsForDay = sums.get(r.game_day.id)!;
    const myTotal = totalsForDay.get(id)!;
    const maxTotal = Math.max(...totalsForDay.values());
    const winnersCount = [...totalsForDay.values()].filter(
      (v) => v === maxTotal
    ).length;
    // Tagessieg: einziger Top-Verdiener.
    const sieg = myTotal === maxTotal && winnersCount === 1 && myTotal > 0;
    playerRows.push({
      id: r.game_day.id,
      played_on: r.game_day.played_on,
      total: myTotal,
      sieg,
    });
  }
  playerRows.sort((a, b) => b.played_on.localeCompare(a.played_on));

  // Bar-Chart-Daten chronologisch (älteste zuerst)
  const chronological = [...playerRows].sort((a, b) =>
    a.played_on.localeCompare(b.played_on)
  );
  const maxVal = Math.max(1, ...chronological.map((r) => r.total));

  return (
    <PhoneFrame activeTab="spieler">
      <div style={{ padding: "12px" }}>
        {/* Top: zurueck-Pfeil + Spielername */}
        <div
          className="flex items-center"
          style={{ gap: 8, marginBottom: 12 }}
        >
          <Link
            href="/spieler"
            style={{
              fontSize: 18,
              color: "#6A7575",
              textDecoration: "none",
              lineHeight: 1,
            }}
          >
            ◀
          </Link>
          <span
            className="font-alfa text-forest"
            style={{ fontSize: 24, lineHeight: 1.1 }}
          >
            {player.name}
          </span>
        </div>

        {/* Platz-Badges in den Aussenpositionen */}
        <div className="flex" style={{ gap: 8, marginBottom: 6 }}>
          <div className="flex-1 text-center">
            <span
              className="inline-block font-oswald font-semibold"
              style={{
                background: "#C94A2B",
                color: "#F2E7CE",
                padding: "3px 10px",
                borderRadius: 5,
                fontSize: 11,
                letterSpacing: "0.06em",
              }}
            >
              PLATZ {rankMoney || "—"}
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex-1 text-center">
            <span
              className="inline-block font-oswald font-semibold"
              style={{
                background: "#1E4A3C",
                color: "#F2E7CE",
                padding: "3px 10px",
                borderRadius: 5,
                fontSize: 11,
                letterSpacing: "0.06em",
              }}
            >
              PLATZ {rankAvg || "—"}
            </span>
          </div>
        </div>

        {/* 3 Stat-Karten */}
        <div className="flex" style={{ gap: 8, marginBottom: 14 }}>
          <StatCard
            value={stats ? eur0.format(stats.total_winnings) : "—"}
            label="Gesamt"
            valueColor="#C94A2B"
          />
          <StatCard
            value={stats ? String(stats.game_days_played) : "0"}
            label="Spieltage"
            valueColor="#0E1A1A"
          />
          <StatCard
            value={stats ? eur.format(stats.avg_per_gameday) : "—"}
            label="€/Spieltag"
            valueColor="#1E4A3C"
          />
        </div>

        {/* Entwicklung — Bar Chart */}
        <SectionLabel>Entwicklung</SectionLabel>
        <div
          className="overflow-x-auto scroll-warm"
          style={{
            background: "#FFFCF4",
            border: "2px solid #0E1A1A",
            borderRadius: 8,
            padding: "10px 10px 6px",
            marginBottom: 14,
          }}
        >
          {chronological.length === 0 ? (
            <div className="text-mist italic" style={{ fontSize: 11 }}>
              Noch keine Daten.
            </div>
          ) : (
            <div
              className="flex items-end"
              style={{
                gap: 4,
                height: 80,
                minWidth: "max-content",
              }}
            >
              {(() => {
                let prevYear: string | null = null;
                const out: React.ReactNode[] = [];
                for (const r of chronological) {
                  const [y, m] = r.played_on.split("-");
                  if (prevYear && y !== prevYear) {
                    out.push(
                      <div
                        key={`sep-${r.id}`}
                        style={{
                          minWidth: 2,
                          background: "#0E1A1A",
                          opacity: 0.25,
                          height: "100%",
                          alignSelf: "stretch",
                          margin: "0 2px",
                        }}
                      />
                    );
                  }
                  const showYear = y !== prevYear;
                  prevYear = y;
                  const pct =
                    r.total === 0
                      ? 5
                      : Math.max(5, Math.round((r.total / maxVal) * 100));
                  const color =
                    r.total === 0
                      ? "#6A7575"
                      : r.sieg
                      ? "#C94A2B"
                      : "#E9B63A";
                  out.push(
                    <div
                      key={r.id}
                      className="flex flex-col items-center justify-end"
                      style={{ minWidth: 28, height: "100%" }}
                    >
                      <div
                        style={{
                          width: "100%",
                          background: color,
                          borderRadius: "3px 3px 0 0",
                          height: `${pct}%`,
                        }}
                      />
                      <div
                        className="font-oswald"
                        style={{
                          fontSize: 9,
                          color: "#6A7575",
                          marginTop: 3,
                        }}
                      >
                        {m}
                      </div>
                      <div
                        className="font-oswald"
                        style={{
                          fontSize: 7,
                          color: showYear ? "#0E1A1A" : "transparent",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {y}
                      </div>
                    </div>
                  );
                }
                return out;
              })()}
            </div>
          )}
        </div>

        {/* Spieltage-Tabelle */}
        <SectionLabel>Spieltage</SectionLabel>
        <div
          className="overflow-y-auto scroll-warm"
          style={{ maxHeight: 180 }}
        >
          {playerRows.length === 0 ? (
            <div className="text-mist italic" style={{ fontSize: 12 }}>
              Noch keine Spieltage erfasst.
            </div>
          ) : (
            <table
              className="w-full border-collapse"
              style={{ fontSize: 12 }}
            >
              <tbody>
                {playerRows.map((r, i) => {
                  const isLast = i === playerRows.length - 1;
                  const border = isLast
                    ? undefined
                    : "1px solid rgba(14,26,26,0.15)";
                  const valStyle =
                    r.sieg
                      ? { color: "#C94A2B", fontWeight: 700 }
                      : r.total === 0
                      ? { color: "#6A7575" }
                      : {};
                  return (
                    <tr
                      key={r.id}
                      className="font-oswald font-semibold"
                    >
                      <td
                        style={{
                          padding: "6px 2px",
                          borderBottom: border,
                        }}
                      >
                        {fmtDateShort(r.played_on)}
                      </td>
                      <td
                        className="text-right"
                        style={{
                          padding: "6px 14px 6px 2px",
                          borderBottom: border,
                          fontSize: 13,
                          ...valStyle,
                        }}
                      >
                        {eur0.format(r.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-oswald uppercase font-semibold text-mist"
      style={{ fontSize: 11, letterSpacing: "0.14em", marginBottom: 6 }}
    >
      {children}
    </div>
  );
}

function StatCard({
  value,
  label,
  valueColor,
}: {
  value: string;
  label: string;
  valueColor: string;
}) {
  return (
    <div
      className="flex-1 text-center"
      style={{
        background: "#FFFCF4",
        border: "2px solid #0E1A1A",
        borderRadius: 8,
        padding: 10,
      }}
    >
      <div
        className="font-oswald font-bold"
        style={{
          fontSize: 22,
          color: valueColor,
          letterSpacing: "0.04em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        className="font-oswald uppercase font-semibold text-mist"
        style={{
          fontSize: 9,
          letterSpacing: "0.14em",
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
  );
}
