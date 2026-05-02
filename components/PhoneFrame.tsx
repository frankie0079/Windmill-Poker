import { Header } from "./Header";
import { BackButton } from "./BackButton";
import { BottomNav, type BottomNavTab } from "./BottomNav";

export function PhoneFrame({
  children,
  activeTab,
}: {
  children: React.ReactNode;
  activeTab: BottomNavTab | null;
}) {
  // Mobile (PWA / iPhone Safari): Cream-Box fuellt den ganzen Bildschirm,
  // BottomNav klebt unten. Auf Desktop bleibt der iPhone-Mockup-Look mit
  // dunklem Rahmen drumherum erhalten.
  return (
    <div className="min-h-screen bg-[#1a1a2e] flex justify-center md:py-6">
      <div
        className="w-full max-w-[420px] min-h-screen bg-cream md:rounded-[14px] md:border-2 md:border-ink overflow-hidden text-ink font-work flex flex-col"
        style={{
          backgroundImage:
            "radial-gradient(rgba(14,26,26,.04) 1px, transparent 1px), radial-gradient(rgba(14,26,26,.03) 1px, transparent 1px)",
          backgroundSize: "3px 3px, 7px 7px",
        }}
      >
        <Header />
        {activeTab !== null && <BackButton href="/" label="Startseite" />}
        <div className="flex-1 flex flex-col min-h-0">{children}</div>
        <BottomNav active={activeTab} />
      </div>
    </div>
  );
}
