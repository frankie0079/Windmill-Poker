import { PhoneFrame } from "@/components/PhoneFrame";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

type ParticipantRow = {
  player: { id: string; name: string };
};

type WaitlistRow = {
  waitlist_rank: number | null;
  player: { id: string; name: string };
};

async function loadPlanning() {
  // Der offene ST IST der nächste Spieltag. Teilnehmer = attendances.
  const { data: gd } = await supabase
    .from("game_days")
    .select("id,played_on")
    .eq("is_closed", false)
    .order("played_on", { ascending: false })
    .limit(1);

  const openSt = gd?.[0];
  if (!openSt) return null;

  const [{ data: att }, { data: planning }, { data: ml }] = await Promise.all([
    supabase
      .from("attendances")
      .select("player:players(id,name)")
      .eq("game_day_id", openSt.id),
    supabase
      .from("next_game_planning")
      .select("waitlist_rank,player:players(id,name)")
      .eq("game_day_id", openSt.id)
      .eq("role", "waitlist"),
    supabase.from("moneylist").select("id,total_winnings"),
  ]);

  const winningsById: Record<string, number> = {};
  for (const r of ml ?? []) winningsById[r.id] = r.total_winnings;

  const participants = ((att ?? []) as unknown as ParticipantRow[]).sort(
    (a, b) =>
      (winningsById[b.player.id] ?? 0) - (winningsById[a.player.id] ?? 0)
  );
  const waitlist = ((planning ?? []) as unknown as WaitlistRow[]).sort(
    (a, b) => (a.waitlist_rank ?? 99) - (b.waitlist_rank ?? 99)
  );

  return { date: openSt.played_on, participants, waitlist };
}

function PosBadge({
  num,
  variant,
}: {
  num: number;
  variant: "participant" | "waitlist";
}) {
  const isWait = variant === "waitlist";
  return (
    <span
      className="inline-block text-center font-oswald font-bold align-middle"
      style={{
        background: isWait ? "#E8D9B5" : "#1E4A3C",
        color: isWait ? "#0E1A1A" : "#F2E7CE",
        border: isWait ? "1px solid rgba(14,26,26,0.4)" : undefined,
        width: 22,
        height: 22,
        lineHeight: "22px",
        borderRadius: "50%",
        fontSize: 11,
        marginRight: 10,
      }}
    >
      {num}
    </span>
  );
}

function RangPill({ rank }: { rank: number }) {
  return (
    <span
      className="inline-flex items-center font-oswald font-semibold uppercase"
      style={{
        gap: 4,
        padding: "3px 8px",
        borderRadius: 10,
        fontSize: 10,
        letterSpacing: "0.1em",
        background: "rgba(201,74,43,0.12)",
        color: "#C94A2B",
        border: "1px solid rgba(201,74,43,0.4)",
      }}
    >
      Rang {rank}
    </span>
  );
}

export default async function TeilnehmerPage() {
  const data = await loadPlanning();

  return (
    <PhoneFrame activeTab={null}>
      <BackButton href="/" />

      {!data ? (
        <div className="p-4 text-mist">Kein nächster Spieltag geplant.</div>
      ) : (
        <>
          <div
            className="flex items-baseline justify-between"
            style={{ padding: "8px 14px 4px" }}
          >
            <div className="font-alfa text-forest" style={{ fontSize: 17 }}>
              TEILNEHMER
            </div>
            <div
              className="font-oswald text-mist"
              style={{ fontSize: 12, letterSpacing: "0.08em" }}
            >
              {fmtDate(data.date)}
            </div>
          </div>

          <div style={{ padding: "0 14px 4px" }}>
            <table className="w-full border-collapse" style={{ fontSize: 13 }}>
              <tbody>
                {data.participants.map((p, i) => {
                  const isLast = i === data.participants.length - 1;
                  const border = isLast
                    ? undefined
                    : "1px solid rgba(14,26,26,0.12)";
                  return (
                    <tr key={p.player.id}>
                      <td
                        className="font-oswald font-semibold"
                        style={{ padding: "8px 0", borderBottom: border }}
                      >
                        <PosBadge num={i + 1} variant="participant" />
                        {p.player.name}
                      </td>
                      <td style={{ borderBottom: border }} />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data.waitlist.length > 0 && (
            <div style={{ padding: "8px 14px 0" }}>
              <div
                className="flex justify-between items-baseline"
                style={{ marginBottom: 4 }}
              >
                <div
                  className="font-oswald uppercase font-semibold text-rust"
                  style={{ fontSize: 11, letterSpacing: "0.12em" }}
                >
                  Warteliste
                </div>
                <div
                  className="text-mist italic"
                  style={{ fontSize: 10 }}
                >
                  Plätze {data.participants.length + 1}–
                  {data.participants.length + data.waitlist.length}
                </div>
              </div>
              <table
                className="w-full border-collapse"
                style={{ fontSize: 13 }}
              >
                <tbody>
                  {data.waitlist.map((w, i) => {
                    const pos = data.participants.length + (i + 1);
                    const isLast = i === data.waitlist.length - 1;
                    const border = isLast
                      ? undefined
                      : "1px solid rgba(14,26,26,0.12)";
                    return (
                      <tr key={w.player.id}>
                        <td
                          className="font-oswald font-semibold"
                          style={{ padding: "8px 0", borderBottom: border }}
                        >
                          <PosBadge num={pos} variant="waitlist" />
                          {w.player.name}
                        </td>
                        <td
                          className="text-right"
                          style={{
                            padding: "8px 0",
                            borderBottom: border,
                          }}
                        >
                          <RangPill rank={w.waitlist_rank ?? 0} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ padding: 14 }} />
        </>
      )}
    </PhoneFrame>
  );
}
