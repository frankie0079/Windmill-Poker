import { supabase } from "./supabase";

// Quelle der Wahrheit für "wann ist der nächste Spieltag und wer kommt".
//
// Es gibt zwei Welten:
//   State A: Der jüngste game_day ist offen (is_closed=false) und hat noch
//     keine round_results. Sein played_on ist das Datum des kommenden Spiels;
//     next_game_planning beschreibt diesen Spieltag selbst.
//   State B: Der jüngste game_day ist closed ODER hat schon round_results
//     (Frank ist mit Eingabe durch). Dann ist der "nächste" Spieltag noch
//     nicht als game_day-Row angelegt; sein Datum steht in
//     latest.next_game_date, und next_game_planning beschreibt diesen
//     zukünftigen Spieltag.
//
// Beide Welten lesen Planungs-Rows mit gleicher game_day_id (= latest.id).

export type UpcomingPlayer = {
  id: string;
  name: string;
};

export type UpcomingWaitlistEntry = UpcomingPlayer & {
  rank: number;
  promoted: boolean;
};

export type UpcomingGame = {
  iso: string;
  participants: UpcomingPlayer[];
  effectiveParticipants: UpcomingPlayer[];
  waitlist: UpcomingWaitlistEntry[];
  remainingWaitlist: UpcomingWaitlistEntry[];
};

type RawPlanRow = {
  player_id: string;
  role: "participant" | "waitlist";
  status: "confirmed" | "cancelled" | null;
  waitlist_rank: 1 | 2 | 3 | null;
  players: { id: string; name: string; is_active: boolean } | null;
};

export async function loadUpcomingGame(): Promise<UpcomingGame | null> {
  const { data: latestArr } = await supabase
    .from("game_days")
    .select("id, played_on, is_closed, next_game_date")
    .order("played_on", { ascending: false })
    .limit(1);
  const latest = latestArr?.[0];
  if (!latest) return null;

  let isStateA = false;
  if (!latest.is_closed) {
    const { count: rrCount } = await supabase
      .from("round_results")
      .select("*", { count: "exact", head: true })
      .eq("game_day_id", latest.id);
    isStateA = (rrCount ?? 0) === 0;
  }

  const iso = isStateA ? latest.played_on : latest.next_game_date;
  if (!iso) return null;

  const { data: planRaw } = await supabase
    .from("next_game_planning")
    .select(
      "player_id, role, status, waitlist_rank, players(id, name, is_active)",
    )
    .eq("game_day_id", latest.id);
  const plan = ((planRaw ?? []) as unknown as RawPlanRow[]).filter(
    (p) => p.players?.is_active === true,
  );

  const participantsRaw = plan.filter((p) => p.role === "participant");
  const cancelledRaw = participantsRaw.filter((p) => p.status === "cancelled");
  const confirmedRaw = participantsRaw.filter(
    (p) => p.status === "confirmed",
  );
  const waitlistRaw = plan
    .filter((p) => p.role === "waitlist")
    .sort((a, b) => (a.waitlist_rank ?? 99) - (b.waitlist_rank ?? 99));
  const promotedRaw = waitlistRaw.slice(0, cancelledRaw.length);
  const remainingWaitRaw = waitlistRaw.slice(cancelledRaw.length);

  const toPlayer = (p: RawPlanRow): UpcomingPlayer => ({
    id: p.players?.id ?? p.player_id,
    name: p.players?.name ?? "?",
  });

  const participants = participantsRaw.map(toPlayer);
  const effectiveParticipants = [
    ...confirmedRaw.map(toPlayer),
    ...promotedRaw.map(toPlayer),
  ];

  // Public-Warteliste: nicht-promotete Wartelistler (oben), gefolgt von
  // cancelled Participants (hinten dran). Cancelled sind heute keine
  // Nachrücker, gehören aber für die nächste Spieltag-Reihenfolge ans Ende
  // der Schlange. Die Ränge werden 1..N fortlaufend neu vergeben.
  const remainingWaitlist: UpcomingWaitlistEntry[] = [
    ...remainingWaitRaw.map(toPlayer),
    ...cancelledRaw.map(toPlayer),
  ].map((p, i) => ({
    ...p,
    rank: i + 1,
    promoted: false,
  }));

  // Vollständige Warteliste inkl. promoteter (für Komponenten die das brauchen).
  const waitlist: UpcomingWaitlistEntry[] = [
    ...promotedRaw.map((p, i) => ({
      ...toPlayer(p),
      rank: p.waitlist_rank ?? i + 1,
      promoted: true,
    })),
    ...remainingWaitlist,
  ];

  return {
    iso,
    participants,
    effectiveParticipants,
    waitlist,
    remainingWaitlist,
  };
}
