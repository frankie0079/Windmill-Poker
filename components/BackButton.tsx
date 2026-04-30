import Link from "next/link";

export function BackButton({ href, label = "Zurück" }: { href: string; label?: string }) {
  return (
    <div style={{ padding: "6px 10px 0" }}>
      <Link
        href={href}
        className="inline-block font-oswald uppercase font-semibold text-forest"
        style={{
          padding: "6px 14px",
          border: "2px solid #0E1A1A",
          borderRadius: 6,
          background: "#F2E7CE",
          fontSize: 11,
          letterSpacing: "0.08em",
          textDecoration: "none",
        }}
      >
        {label}
      </Link>
    </div>
  );
}
