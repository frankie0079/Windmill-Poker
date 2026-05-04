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

  // State-A→B-Übergang: vor dem ersten Speichern beschreibt das Planning den
  // offenen ST selbst. Sobald Ergebnisse erfasst werden, wird der Spieltag
  // historisch und das Planning soll von jetzt an den ÜBERNÄCHSTEN ST
  // beschreiben (Frank plant ST X+2). Reset: Cancelled-Participants und alle
  // Wartelistler löschen, sodass die Confirmed-Participants als Starter für
  // die nächste Planung übrig bleiben.
  const { count: priorResultsCount } = await supabase
    .from("round_results")
    .select("*", { count: "exact", head: true })
    .eq("game_day_id", gameDayId);
  const isFirstSave = (priorResultsCount ?? 0) === 0;

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

  if (isFirstSave) {
    // Wartelistler löschen.
    const { error: wlErr } = await supabase
      .from("next_game_planning")
      .delete()
      .eq("game_day_id", gameDayId)
      .eq("role", "waitlist");
    if (wlErr) throw new Error(wlErr.message);
    // Cancelled-Participants löschen — die haben den Spieltag nicht gespielt.
    const { error: cancErr } = await supabase
      .from("next_game_planning")
      .delete()
      .eq("game_day_id", gameDayId)
      .eq("role", "participant")
      .eq("status", "cancelled");
    if (cancErr) throw new Error(cancErr.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/naechster");
  revalidatePath("/spieltage");
  revalidatePath("/spieler");
  revalidatePath("/ranking");
  revalidatePath("/");
}
