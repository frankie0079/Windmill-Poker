import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { supabase, type MoneylistRow } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eur2 = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

type View = "total" | "avg";

function Toggle({ active }: { active: View }) {
  // Mockup: margin:6px 10px; border:2px solid ink; rounded; oswald uppercase
  // 12px 600; padding:7px je Tab.
  const base =
    "flex-1 text-center font-oswald uppercase font-semibold no-underline";
  const tabStyle = { padding: 7, textDecoration: "none" };
  return (
    <div
      className="flex border-2 border-ink rounded-md overflow-hidden"
      style={{ margin: "6px 10px", fontSize: 12, letterSpacing: "0.14em" }}
    >
      <Link
        href="/ranking"
        className={`${base} ${
          active === "total" ? "bg-forest text-cream" : "text-slate"
        }`}
        style={tabStyle}
      >
        Moneylist
      </Link>
      <Link
        href="/ranking?view=avg"
        className={`${base} ${
          active === "avg" ? "bg-forest text-cream" : "text-slate"
        }`}
        style={tabStyle}
      >
        €/Spieltag
      </Link>
    </div>
  );
}

function RankingTable({
  rows,
  view,
}: {
  rows: MoneylistRow[];
  view: View;
}) {
  const valueColLabel = view === "avg" ? "€/Spt" : "Gewinn";

  return (
    <div style={{ padding: "0 10px 2px" }}>
      <table
        className="w-full border-collapse font-work"
        style={{ fontSize: 13 }}
      >
        <thead>
          <tr
            className="font-oswald uppercase text-mist font-semibold text-left"
            style={{ fontSize: 10, letterSpacing: "0.14em" }}
          >
            <th
              style={{
                padding: "5px 3px",
                borderBottom: "2px solid rgba(14,26,26,0.35)",
              }}
            >
              #
            </th>
            <th
              style={{
                padding: "5px 3px",
                borderBottom: "2px solid rgba(14,26,26,0.35)",
              }}
            >
              Spieler
            </th>
            <th
              className="text-right"
              style={{
                padding: "5px 3px",
                borderBottom: "2px solid rgba(14,26,26,0.35)",
              }}
            >
              {valueColLabel}
            </th>
            <th
              className="text-right"
              style={{
                padding: "5px 3px",
                borderBottom: "2px solid rgba(14,26,26,0.35)",
              }}
            >
              ST
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const rank = i + 1;
            const isLast = i === rows.length - 1;
            const cellBorder = isLast
              ? undefined
              : "1px solid rgba(14,26,26,0.15)";
            const isTop1 = rank === 1;
            const isTop23 = rank === 2 || rank === 3;

            const value =
              view === "avg"
                ? eur2.format(r.avg_per_gameday)
                : eur.format(r.total_winnings);

            return (
              <tr
                key={r.id}
                style={
                  isTop1 ? { color: "#C94A2B", fontWeight: 700 } : undefined
                }
              >
                <td style={{ padding: "6px 3px", borderBottom: cellBorder }}>
                  {isTop1 ? (
                    <span
                      className="bg-rust text-cream font-oswald font-semibold rounded"
                      style={{ padding: "1px 5px", fontSize: 11 }}
                    >
                      1
                    </span>
                  ) : isTop23 ? (
                    <span
                      className="bg-tan font-oswald font-semibold rounded"
                      style={{ padding: "1px 5px", fontSize: 11 }}
                    >
                      {rank}
                    </span>
                  ) : (
                    <span
                      className="text-mist font-oswald"
                      style={{ padding: "1px 5px", fontSize: 11 }}
                    >
                      {rank}
                    </span>
                  )}
                </td>
                <td
                  className="font-oswald font-semibold"
                  style={{ padding: "6px 3px", borderBottom: cellBorder }}
                >
                  {r.name}
                </td>
                <td
                  className="text-right font-oswald font-semibold"
                  style={{
                    padding: "6px 3px",
                    borderBottom: cellBorder,
                    fontSize: isTop1 ? 14 : undefined,
                    letterSpacing: isTop1 ? "0.06em" : undefined,
                  }}
                >
                  {value}
                </td>
                <td
                  className="text-right"
                  style={{
                    padding: "6px 3px",
                    borderBottom: cellBorder,
                    fontSize: 12,
                    color: isTop1 ? undefined : "#6A7575",
                  }}
                >
                  {r.game_days_played}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {view === "avg" && (
        <div
          className="text-mist italic"
          style={{
            padding: "8px 4px 0",
            fontSize: 10,
            lineHeight: 1.4,
          }}
        >
          Wertung nur für Spieler mit ≥8 Teilnahmen.
        </div>
      )}
    </div>
  );
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view: viewParam } = await searchParams;
  const view: View = viewParam === "avg" ? "avg" : "total";

  const { data, error } = await supabase.from("moneylist").select("*");
  let rows = (data ?? []) as MoneylistRow[];

  if (view === "avg") {
    rows = rows
      .filter((r) => r.game_days_played >= 8)
      .sort((a, b) => b.avg_per_gameday - a.avg_per_gameday);
  } else {
    rows = rows.sort((a, b) => b.total_winnings - a.total_winnings);
  }

  return (
    <PhoneFrame activeTab="ranking">
      <Toggle active={view} />
      {error ? (
        <pre className="text-rust text-xs p-2">{error.message}</pre>
      ) : (
        <RankingTable rows={rows} view={view} />
      )}
    </PhoneFrame>
  );
}
