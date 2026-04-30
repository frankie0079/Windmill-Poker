import Link from "next/link";

export type BottomNavTab = "ranking" | "spieltage" | "spieler" | "admin";

const tabs: ReadonlyArray<{
  key: BottomNavTab;
  icon: string;
  label: string;
  href: string;
}> = [
  { key: "ranking", icon: "📊", label: "Ranking", href: "/ranking" },
  { key: "spieltage", icon: "📅", label: "Spieltage", href: "/spieltage" },
  { key: "spieler", icon: "👤", label: "Spieler", href: "/spieler" },
  { key: "admin", icon: "⚙️", label: "Admin", href: "/admin" },
];

export function BottomNav({ active }: { active: BottomNavTab | null }) {
  return (
    <div
      className="flex bg-tan flex-shrink-0"
      style={{ borderTop: "2px solid rgba(14,26,26,0.35)" }}
    >
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            className="flex-1 text-center font-oswald uppercase"
            style={{
              padding: "10px 4px",
              fontSize: 10,
              letterSpacing: "0.1em",
              color: isActive ? "#C94A2B" : "#3A4747",
              fontWeight: isActive ? 600 : 400,
              borderTop: isActive ? "2px solid #C94A2B" : undefined,
              marginTop: isActive ? -2 : 0,
              textDecoration: "none",
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 2 }}>{t.icon}</div>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
