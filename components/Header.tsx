export function Header() {
  // Mockup-Vorgabe (docs/mockups/*.html, identisch in allen Screens):
  // height:80px overflow:hidden; padding:0 16px; gap:12; logo height:140 overflowing.
  return (
    <div
      className="bg-rust text-cream flex items-center justify-center overflow-hidden flex-shrink-0"
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
