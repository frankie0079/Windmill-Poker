"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");
  return supabase;
}

// Speichert eine Runde: löscht alle bestehenden round_results für
// (game_day_id, round_number) und schreibt für JEDEN Teilnehmer eine Row,
// damit "0€" eindeutig "teilgenommen, nichts gewonnen" bedeutet (statt
// "Row fehlt").
export async function saveRound(
  gameDayId: string,
  roundNumber: 1 | 2,
  payouts: Array<{ playerId: string; payout: number }>,
) {
  const supabase = await requireAdmin();

  // Validate: alle playerIds sind attendees dieses STs.
  const { data: att, error: attErr } = await supabase
    .from("attendances")
    .select("player_id")
    .eq("game_day_id", gameDayId);
  if (attErr) throw new Error(attErr.message);
  const attIds = new Set((att ?? []).map((a) => a.player_id));
  for (const p of payouts) {
    if (!attIds.has(p.playerId)) {
      throw new Error(`Spieler ${p.playerId} ist nicht Teilnehmer dieses ST`);
    }
  }

  const { error: delErr } = await supabase
    .from("round_results")
    .delete()
    .eq("game_day_id", gameDayId)
    .eq("round_number", roundNumber);
  if (delErr) throw new Error(delErr.message);

  const rows = payouts.map((p) => ({
    game_day_id: gameDayId,
    player_id: p.playerId,
    round_number: roundNumber,
    payout: p.payout,
  }));
  const { error: insErr } = await supabase.from("round_results").insert(rows);
  if (insErr) throw new Error(insErr.message);

  revalidatePath("/admin");
  revalidatePath("/admin/naechster");
  revalidatePath("/spieltage");
  revalidatePath("/spieler");
  revalidatePath("/ranking");
  revalidatePath("/");
}
