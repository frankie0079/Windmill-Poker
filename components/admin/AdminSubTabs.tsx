import Link from "next/link";

export type AdminTab = "eingabe" | "naechster";

const tabs: ReadonlyArray<{ key: AdminTab; label: string; href: string }> = [
  { key: "eingabe", label: "Eingabe Spieltag", href: "/admin" },
  { key: "naechster", label: "Nächster Spieltag", href: "/admin/naechster" },
];

export function AdminSubTabs({ active }: { active: AdminTab }) {
  return (
    <div
      className="flex border-2 border-ink overflow-hidden font-oswald uppercase font-semibold"
      style={{
        margin: "6px 10px 4px",
        borderRadius: 6,
        fontSize: 11,
        letterSpacing: "0.06em",
      }}
    >
      {tabs.map((t, i) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={`flex-1 text-center no-underline ${
              isActive ? "bg-forest text-cream" : "bg-cream text-slate"
            }`}
            style={{
              padding: "8px 4px",
              borderLeft: i === 0 ? undefined : "1px solid #0E1A1A",
              textDecoration: "none",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
