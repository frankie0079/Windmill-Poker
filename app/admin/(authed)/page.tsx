import { redirect } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AdminSubTabs } from "@/components/admin/AdminSubTabs";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { EingabeForm } from "./EingabeForm";

export const dynamic = "force-dynamic";

type AttendanceJoin = {
  player_id: string;
  players: { id: string; name: string } | null;
};

export default async function AdminEingabePage() {
  const supabase = await createSupabaseServerClient();

  // Offener Spieltag = der einzige mit is_closed=false. Es kann nur einen
  // geben (sonst hat der Workflow ein Problem).
  const { data: openArr } = await supabase
    .from("game_days")
    .select("id, played_on")
    .eq("is_closed", false)
    .order("played_on", { ascending: false })
    .limit(1);
  const open = openArr?.[0];

  // ST-Nummer für die Anzeige.
  const { count: totalCount } = await supabase
    .from("game_days")
    .select("*", { count: "exact", head: true });

  // Kein offener Spieltag: hier gibt es nichts zu erfassen, also direkt
  // zur Planung springen.
  if (!open) redirect("/admin/naechster");

  const [attRes, rrRes] = await Promise.all([
    supabase
      .from("attendances")
      .select("player_id, players(id, name)")
      .eq("game_day_id", open.id),
    supabase
      .from("round_results")
      .select("player_id, round_number, payout")
      .eq("game_day_id", open.id),
  ]);

  const attendees = ((attRes.data ?? []) as unknown as AttendanceJoin[])
    .map((a) => a.players)
    .filter((p): p is { id: string; name: string } => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  const existing = {
    1: new Map<string, number>(),
    2: new Map<string, number>(),
  };
  for (const r of rrRes.data ?? []) {
    if (r.round_number === 1 || r.round_number === 2) {
      existing[r.round_number as 1 | 2].set(r.player_id, Number(r.payout));
    }
  }

  // Default-aktive Runde: R1 wenn noch nicht gespeichert, sonst R2.
  const initialActive: 1 | 2 = existing[1].size > 0 && existing[2].size === 0 ? 2 : 1;

  const datumLabel = new Date(open.played_on).toLocaleDateString("de-DE");

  return (
    <PhoneFrame activeTab="admin">
      <AdminSubTabs active="eingabe" />

      <div
        style={{
          padding: "8px 14px 4px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div className="font-alfa text-forest" style={{ fontSize: 17 }}>
          SPIELTAG ERFASSEN
        </div>
        <div
          className="font-oswald text-mist"
          style={{ fontSize: 12, letterSpacing: "0.08em" }}
        >
          ST {totalCount ?? "?"} · {datumLabel}
        </div>
      </div>

      <EingabeForm
        gameDayId={open.id}
        playedOnLabel={datumLabel}
        attendees={attendees}
        existing={existing}
        initialActive={initialActive}
      />
    </PhoneFrame>
  );
}
