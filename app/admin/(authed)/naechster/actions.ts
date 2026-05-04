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

// State A = offener Spieltag, noch keine round_results. Die Planung beschreibt
// den offenen Spieltag selbst und attendances spiegelt die "effective" Teilnehmer
// (confirmed + automatisch nachgerückte Wartelistler) wider. Kommt jede Änderung
// an Status oder Wartelisten-Rang vor, muss attendances re-materialisiert werden.
async function isStateA(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  gameDayId: string,
): Promise<boolean> {
  const { data: gd } = await supabase
    .from("game_days")
    .select("is_closed")
    .eq("id", gameDayId)
    .maybeSingle();
  if (!gd || gd.is_closed) return false;
  const { count } = await supabase
    .from("round_results")
    .select("*", { count: "exact", head: true })
    .eq("game_day_id", gameDayId);
  return (count ?? 0) === 0;
}

type PlanRowWithPlayer = {
  player_id: string;
  role: "participant" | "waitlist";
  status: "confirmed" | "cancelled" | null;
  waitlist_rank: 1 | 2 | 3 | null;
  players: { is_active: boolean } | null;
};

async function readPlanning(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  gameDayId: string,
): Promise<PlanRowWithPlayer[]> {
  const { data } = await supabase
    .from("next_game_planning")
    .select("player_id, role, status, waitlist_rank, players(is_active)")
    .eq("game_day_id", gameDayId);
  return ((data ?? []) as unknown as PlanRowWithPlayer[]).filter(
    (p) => p.players?.is_active === true,
  );
}

function computeEffective(plan: PlanRowWithPlayer[]) {
  const participants = plan.filter((p) => p.role === "participant");
  const cancelled = participants.filter((p) => p.status === "cancelled");
  const confirmed = participants.filter((p) => p.status === "confirmed");
  const waitlist = plan
    .filter((p) => p.role === "waitlist")
    .sort((a, b) => (a.waitlist_rank ?? 99) - (b.waitlist_rank ?? 99));
  const promoted = waitlist.slice(0, cancelled.length);
  const remainingWait = waitlist.slice(cancelled.length);
  return { confirmed, cancelled, waitlist, promoted, remainingWait };
}

async function syncAttendancesIfStateA(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  gameDayId: string,
) {
  if (!(await isStateA(supabase, gameDayId))) return;
  const plan = await readPlanning(supabase, gameDayId);
  const { confirmed, promoted } = computeEffective(plan);
  const effectiveIds = [...confirmed, ...promoted].map((p) => p.player_id);

  await supabase.from("attendances").delete().eq("game_day_id", gameDayId);
  if (effectiveIds.length > 0) {
    const rows = effectiveIds.map((pid) => ({
      game_day_id: gameDayId,
      player_id: pid,
    }));
    const { error } = await supabase.from("attendances").insert(rows);
    if (error) throw new Error(error.message);
  }
}

// Datum: in State A schreibt es played_on des offenen STs (das IST das Datum
// des nächsten Spieltags). In State B schreibt es next_game_date des aktuellen
// STs (geplantes Datum für das noch zu erstellende Folge-ST).
export async function updateNextGameDate(gameDayId: string, isoDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new Error(`Ungültiges Datum: ${isoDate}`);
  }
  const supabase = await requireAdmin();

  const stateA = await isStateA(supabase, gameDayId);
  const field = stateA ? "played_on" : "next_game_date";

  const { error } = await supabase
    .from("game_days")
    .update({ [field]: isoDate })
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
  await syncAttendancesIfStateA(supabase, gameDayId);
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

  await syncAttendancesIfStateA(supabase, gameDayId);
  revalidateAll();
}

// Lifecycle State B → State A: erstellt den nächsten game_day und migriert die
// Planung dort hin. Cancelled Participants werden gedroppt, nachgerückte
// Wartelistler zu role=participant promoted, übrige Wartelistler re-ranked.
// Resultat: Planning beschreibt jetzt den neuen offenen ST selbst.
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

  const plan = await readPlanning(supabase, currentGameDayId);
  const { confirmed, cancelled, promoted, remainingWait } =
    computeEffective(plan);
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

  // Planning auf neuen ST migrieren.
  // 1) Cancelled Participants droppen — sie haben sich aus dem Spieltag verabschiedet.
  if (cancelled.length > 0) {
    const cancelledIds = cancelled.map((p) => p.player_id);
    const { error } = await supabase
      .from("next_game_planning")
      .delete()
      .eq("game_day_id", currentGameDayId)
      .in("player_id", cancelledIds);
    if (error) throw new Error(error.message);
  }

  // 2) Nachgerückte Wartelistler zu role=participant umflaggen.
  if (promoted.length > 0) {
    const promotedIds = promoted.map((p) => p.player_id);
    const { error } = await supabase
      .from("next_game_planning")
      .update({
        role: "participant",
        status: "confirmed",
        waitlist_rank: null,
      })
      .eq("game_day_id", currentGameDayId)
      .in("player_id", promotedIds);
    if (error) throw new Error(error.message);
  }

  // 3) Übrige Wartelistler re-ranken (1..N), damit es keine Lücken in der
  // Reihenfolge gibt nach dem Promoten.
  for (let i = 0; i < remainingWait.length; i++) {
    const { error } = await supabase
      .from("next_game_planning")
      .update({ waitlist_rank: i + 1 })
      .eq("game_day_id", currentGameDayId)
      .eq("player_id", remainingWait[i].player_id);
    if (error) throw new Error(error.message);
  }

  // 4) Alle übrig gebliebenen Rows auf neuen ST umhängen.
  const { error: moveErr } = await supabase
    .from("next_game_planning")
    .update({ game_day_id: newGd.id })
    .eq("game_day_id", currentGameDayId);
  if (moveErr) throw new Error(moveErr.message);

  // 5) Aktuellen ST schließen.
  await supabase
    .from("game_days")
    .update({ is_closed: true, next_game_date: null })
    .eq("id", currentGameDayId);

  revalidateAll();
  redirect("/admin/naechster");
}
