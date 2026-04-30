import { supabase, type MoneylistRow } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1a1a2e] py-6 flex items-start justify-center">
      <div
        className="w-[375px] max-w-[375px] bg-cream rounded-[14px] border-2 border-ink overflow-hidden text-ink font-work"
        style={{
          backgroundImage:
            "radial-gradient(rgba(14,26,26,.04) 1px, transparent 1px), radial-gradient(rgba(14,26,26,.03) 1px, transparent 1px)",
          backgroundSize: "3px 3px, 7px 7px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Header() {
  // Mockup: padding:0 16px; gap:12px; height:80px; overflow:hidden;
  // Logo: height:140px;width:auto; absichtlich überlappend.
  return (
    <div
      className="bg-rust text-cream flex items-center justify-center overflow-hidden"
      style={{ height: 80, padding: "0 16px", gap: 12 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Windmill Poker"
        style={{
          height: 140,
          width: "auto",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))",
        }}
      />
      <span
        className="font-alfa whitespace-nowrap"
        style={{ fontSize: 22, letterSpacing: "0.02em", lineHeight: 1 }}
      >
        WINDMILL POKER
      </span>
    </div>
  );
}

function Toggle({ active }: { active: "moneylist" | "avg" }) {
  // Mockup: margin:6px 10px; border:2px solid ink; rounded; oswald uppercase 12px 600;
  // padding:7px je Tab.
  const base =
    "flex-1 text-center font-oswald uppercase font-semibold";
  return (
    <div
      className="flex border-2 border-ink rounded-md overflow-hidden"
      style={{
        margin: "6px 10px",
        fontSize: 12,
        letterSpacing: "0.14em",
      }}
    >
      <div
        className={`${base} ${
          active === "moneylist" ? "bg-forest text-cream" : "text-slate"
        }`}
        style={{ padding: 7 }}
      >
        Moneylist
      </div>
      <div
        className={`${base} ${
          active === "avg" ? "bg-forest text-cream" : "text-slate"
        }`}
        style={{ padding: 7 }}
      >
        €/Spieltag
      </div>
    </div>
  );
}

function MoneylistTable({ rows }: { rows: MoneylistRow[] }) {
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
              Gewinn
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
                      style={{
                        padding: "1px 5px",
                        fontSize: 11,
                      }}
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
                  {eur.format(r.total_winnings)}
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
    </div>
  );
}

function BottomNav({
  active,
}: {
  active: "ranking" | "spieltage" | "spieler" | "admin";
}) {
  const tabs = [
    { key: "ranking", icon: "📊", label: "Ranking" },
    { key: "spieltage", icon: "📅", label: "Spieltage" },
    { key: "spieler", icon: "👤", label: "Spieler" },
    { key: "admin", icon: "⚙️", label: "Admin" },
  ] as const;

  return (
    <div
      className="flex bg-tan"
      style={{ borderTop: "2px solid rgba(14,26,26,0.35)" }}
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <div
            key={t.key}
            className="flex-1 text-center font-oswald uppercase"
            style={{
              padding: "10px 4px",
              fontSize: 10,
              letterSpacing: "0.1em",
              color: isActive ? "#C94A2B" : "#3A4747",
              fontWeight: isActive ? 600 : 400,
              borderTop: isActive ? "2px solid #C94A2B" : undefined,
              marginTop: isActive ? -2 : 0,
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 2 }}>{t.icon}</div>
            {t.label}
          </div>
        );
      })}
    </div>
  );
}

export default async function Home() {
  const { data, error } = await supabase
    .from("moneylist")
    .select("*")
    .order("total_winnings", { ascending: false });

  const rows = (data ?? []) as MoneylistRow[];

  return (
    <PhoneFrame>
      <Header />
      <Toggle active="moneylist" />
      {error ? (
        <pre className="text-rust text-xs p-2">{error.message}</pre>
      ) : (
        <MoneylistTable rows={rows} />
      )}
      <BottomNav active="ranking" />
    </PhoneFrame>
  );
}
