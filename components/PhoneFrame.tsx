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
  // Auf Tab-Pages (Ranking, Spieltage, Spieler, Admin) gibt es bisher keinen
  // Weg zurueck zum Deckblatt — Sub-Pages mit activeTab=null haben dafuer
  // ihren eigenen BackButton.
  return (
    <div className="min-h-screen bg-[#1a1a2e] py-6 flex items-start justify-center">
      <div
        className="w-[375px] max-w-[375px] bg-cream rounded-[14px] border-2 border-ink overflow-hidden text-ink font-work flex flex-col"
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
