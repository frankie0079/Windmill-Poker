"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");
  return supabase;
}

function revalidateAll() {
  revalidatePath("/admin/naechster");
  revalidatePath("/admin");
  revalidatePath("/teilnehmer");
  revalidatePath("/");
}

// Datum: erwartet ISO-String YYYY-MM-DD
export async function updateNextGameDate(gameDayId: string, isoDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new Error(`Ungültiges Datum: ${isoDate}`);
  }
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("game_days")
    .update({ next_game_date: isoDate })
    .eq("id", gameDayId);
  if (error) throw new Error(error.message);
  revalidateAll();
}

export async function setParticipantStatus(
  gameDayId: string,
  playerId: string,
  status: "confirmed" | "cancelled",
) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("next_game_planning")
    .update({ status })
    .eq("game_day_id", gameDayId)
    .eq("player_id", playerId);
  if (error) throw new Error(error.message);
  revalidateAll();
}

// Setzt einen Warteliste-Rang. Bei Konflikt mit anderem Spieler: Swap.
export async function setWaitlistRank(
  gameDayId: string,
  playerId: string,
  newRank: 1 | 2 | 3,
) {
  const supabase = await requireAdmin();

  const { data: rows, error: readErr } = await supabase
    .from("next_game_planning")
    .select("player_id, waitlist_rank")
    .eq("game_day_id", gameDayId)
    .eq("role", "waitlist");
  if (readErr) throw new Error(readErr.message);

  const me = rows?.find((r) => r.player_id === playerId);
  const conflict = rows?.find(
    (r) => r.waitlist_rank === newRank && r.player_id !== playerId,
  );
  if (!me) throw new Error("Spieler nicht in Warteliste");

  // Wenn ein anderer Spieler den Ziel-Rang hält: Swap.
  if (conflict) {
    const { error: swapErr } = await supabase
      .from("next_game_planning")
      .update({ waitlist_rank: me.waitlist_rank })
      .eq("game_day_id", gameDayId)
      .eq("player_id", conflict.player_id);
    if (swapErr) throw new Error(swapErr.message);
  }
  const { error } = await supabase
    .from("next_game_planning")
    .update({ waitlist_rank: newRank })
    .eq("game_day_id", gameDayId)
    .eq("player_id", playerId);
  if (error) throw new Error(error.message);
  revalidateAll();
}

// Schließt den aktuellen Spieltag-Lifecycle ab und startet den nächsten:
// legt einen neuen game_day mit attendances aus der Planung an, hängt
// next_game_date um, löscht die alte Planung. Validiert vorher streng,
// damit kein halbgarer Zustand entsteht.
export async function closeAndStartNext(currentGameDayId: string) {
  const supabase = await requireAdmin();

  const { data: cur, error: curErr } = await supabase
    .from("game_days")
    .select("id, played_on, next_game_date, is_closed")
    .eq("id", currentGameDayId)
    .single();
  if (curErr || !cur) throw new Error("Aktueller Spieltag nicht gefunden");
  if (!cur.next_game_date) {
    throw new Error("Kein Datum für nächsten Spieltag gesetzt");
  }

  const { data: dupe } = await supabase
    .from("game_days")
    .select("id")
    .eq("played_on", cur.next_game_date);
  if (dupe && dupe.length > 0) {
    throw new Error(`Spieltag am ${cur.next_game_date} existiert bereits`);
  }

  type PlanRow = {
    player_id: string;
    role: "participant" | "waitlist";
    status: "confirmed" | "cancelled" | null;
    waitlist_rank: 1 | 2 | 3 | null;
    players: { is_active: boolean } | null;
  };
  const { data: planRaw } = await supabase
    .from("next_game_planning")
    .select(
      "player_id, role, status, waitlist_rank, players(is_active)",
    )
    .eq("game_day_id", currentGameDayId);
  const plan = ((planRaw ?? []) as unknown as PlanRow[]).filter(
    (p) => p.players?.is_active === true,
  );

  const participants = plan.filter((p) => p.role === "participant");
  const cancelled = participants.filter((p) => p.status === "cancelled");
  const confirmed = participants.filter((p) => p.status === "confirmed");
  const waitlist = plan
    .filter((p) => p.role === "waitlist")
    .sort((a, b) => (a.waitlist_rank ?? 99) - (b.waitlist_rank ?? 99));
  const promoted = waitlist.slice(0, cancelled.length);
  const effective = [...confirmed, ...promoted];

  if (effective.length === 0) {
    throw new Error("Keine Teilnehmer für den neuen Spieltag");
  }

  const { data: newGd, error: insErr } = await supabase
    .from("game_days")
    .insert({
      played_on: cur.next_game_date,
      is_closed: false,
      next_game_date: null,
    })
    .select("id")
    .single();
  if (insErr || !newGd) {
    throw new Error(insErr?.message ?? "Anlegen fehlgeschlagen");
  }

  const attRows = effective.map((p) => ({
    game_day_id: newGd.id,
    player_id: p.player_id,
  }));
  const { error: attErr } = await supabase.from("attendances").insert(attRows);
  if (attErr) throw new Error(attErr.message);

  await supabase
    .from("game_days")
    .update({ is_closed: true, next_game_date: null })
    .eq("id", currentGameDayId);

  await supabase
    .from("next_game_planning")
    .delete()
    .eq("game_day_id", currentGameDayId);

  revalidateAll();
  redirect("/admin");
}
