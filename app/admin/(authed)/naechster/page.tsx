import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AdminSubTabs } from "@/components/admin/AdminSubTabs";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DateInput } from "./DateInput";
import { ParticipantRow } from "./ParticipantRow";
import { WaitlistRow } from "./WaitlistRow";
import { CloseGameDayButton } from "./CloseGameDayButton";

export const dynamic = "force-dynamic";

type PlanRow = {
  game_day_id: string;
  player_id: string;
  role: "participant" | "waitlist";
  status: "confirmed" | "cancelled" | null;
  waitlist_rank: 1 | 2 | 3 | null;
  players: { name: string; is_active: boolean } | null;
};

export default async function NaechsterPage() {
  const supabase = await createSupabaseServerClient();

  // Letzter (jüngster) Spieltag — der trägt die Planung für den nächsten.
  const { data: latestArr } = await supabase
    .from("game_days")
    .select("id, played_on, next_game_date")
    .order("played_on", { ascending: false })
    .limit(1);
  const latest = latestArr?.[0];

  // Gesamt-Anzahl Spieltage für die ST-Nummer-Anzeige.
  const { count: totalCount } = await supabase
    .from("game_days")
    .select("*", { count: "exact", head: true });
  const stNumber = totalCount ?? 0;

  if (!latest) {
    return (
      <PhoneFrame activeTab="admin">
        <AdminSubTabs active="naechster" />
        <div
          className="text-mist font-oswald uppercase"
          style={{ padding: 14, fontSize: 12, letterSpacing: "0.08em" }}
        >
          Noch kein Spieltag in der Datenbank.
        </div>
      </PhoneFrame>
    );
  }

  const { data: planRaw } = await supabase
    .from("next_game_planning")
    .select(
      "game_day_id, player_id, role, status, waitlist_rank, players(name, is_active)",
    )
    .eq("game_day_id", latest.id)
    .order("role", { ascending: true })
    .order("waitlist_rank", { ascending: true });
  // Inaktive Spieler raus — sie sollen nicht in der Planung auftauchen.
  const plan = ((planRaw ?? []) as unknown as PlanRow[]).filter(
    (p) => p.players?.is_active === true,
  );

  const participants = plan.filter((p) => p.role === "participant");
  const waitlist = plan
    .filter((p) => p.role === "waitlist")
    .sort((a, b) => (a.waitlist_rank ?? 99) - (b.waitlist_rank ?? 99));

  const confirmedCount = participants.filter((p) => p.status === "confirmed").length;
  const cancelledCount = participants.filter((p) => p.status === "cancelled").length;
  // Nachrück-Logik: die ersten {cancelledCount} Wartelistler rücken nach.
  const promotedPlayerIds = new Set(
    waitlist.slice(0, cancelledCount).map((w) => w.player_id),
  );
  const effectiveCount = confirmedCount + promotedPlayerIds.size;
  const isReady = effectiveCount >= participants.length;

  const initialDate = latest.next_game_date ?? "";
  const currentDateLabel = new Date(latest.played_on).toLocaleDateString("de-DE");
  const promotedNames = waitlist
    .filter((w) => promotedPlayerIds.has(w.player_id))
    .map((w) => w.players?.name ?? "?")
    .join(", ");

  return (
    <PhoneFrame activeTab="admin">
      <AdminSubTabs active="naechster" />

      <div
        style={{
          padding: "8px 14px 4px",
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div className="font-alfa text-forest" style={{ fontSize: 17 }}>
          NÄCHSTER SPIELTAG
        </div>
        <div
          className="font-oswald text-mist"
          style={{ fontSize: 12, letterSpacing: "0.08em" }}
        >
          ST {stNumber} → ST {stNumber + 1}
        </div>
      </div>

      <DateInput gameDayId={latest.id} initial={initialDate} />

      <div style={{ padding: "0 14px" }}>
        <div
          className="flex items-baseline justify-between"
          style={{ marginBottom: 4 }}
        >
          <div
            className="font-oswald uppercase text-forest font-semibold"
            style={{ fontSize: 11, letterSpacing: "0.12em" }}
          >
            Teilnehmer ST {stNumber + 1}
          </div>
          <div
            className="font-oswald text-mist"
            style={{ fontSize: 11 }}
          >
            {confirmedCount} dabei · {cancelledCount} abgesagt
          </div>
        </div>
        <table className="w-full border-collapse" style={{ fontSize: 13 }}>
          <tbody>
            {participants.map((p, i) => (
              <ParticipantRow
                key={p.player_id}
                gameDayId={latest.id}
                playerId={p.player_id}
                name={p.players?.name ?? "?"}
                status={(p.status ?? "confirmed") as "confirmed" | "cancelled"}
                isLast={i === participants.length - 1}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: "8px 14px 4px" }}>
        <div
          className="flex items-baseline justify-between"
          style={{ marginBottom: 4, marginTop: 6 }}
        >
          <div
            className="font-oswald uppercase font-semibold"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "#C94A2B",
            }}
          >
            Warteliste
          </div>
          <div
            className="text-mist italic"
            style={{ fontSize: 10 }}
          >
            Rang manuell wählen
          </div>
        </div>
        <table className="w-full border-collapse" style={{ fontSize: 13 }}>
          <tbody>
            {waitlist.map((w, i) => (
              <WaitlistRow
                key={w.player_id}
                gameDayId={latest.id}
                playerId={w.player_id}
                name={w.players?.name ?? "?"}
                rank={(w.waitlist_rank ?? (i + 1)) as 1 | 2 | 3}
                promoted={promotedPlayerIds.has(w.player_id)}
                isLast={i === waitlist.length - 1}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          margin: "8px 14px 6px",
          padding: "10px 12px",
          background: "rgba(30,74,60,0.10)",
          border: "2px solid #1E4A3C",
          borderRadius: 8,
        }}
      >
        <div className="flex justify-between items-center">
          <span
            className="font-oswald uppercase text-forest font-semibold"
            style={{ fontSize: 11, letterSpacing: "0.12em" }}
          >
            Status
          </span>
          <span
            className="font-oswald text-forest"
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            {isReady ? "✓ Bereit" : `⚠ ${participants.length - effectiveCount} offen`}
          </span>
        </div>
        <div className="text-slate" style={{ fontSize: 11, marginTop: 3 }}>
          {effectiveCount} bestätigt für{" "}
          {initialDate
            ? new Date(initialDate).toLocaleDateString("de-DE")
            : "—"}
          {promotedNames && ` (${promotedNames} nachgerückt).`}
          {!promotedNames && "."}
        </div>
      </div>

      <div style={{ padding: "6px 14px 4px" }}>
        <Link
          href="/admin/spielerverwaltung"
          className="block text-center font-oswald uppercase font-semibold text-forest no-underline"
          style={{
            padding: 11,
            background: "transparent",
            border: "2px solid #1E4A3C",
            borderRadius: 8,
            fontSize: 12,
            letterSpacing: "0.12em",
            textDecoration: "none",
          }}
        >
          ⚙ Spielerverwaltung
        </Link>
      </div>

      <div
        style={{
          margin: "10px 14px 14px",
          paddingTop: 12,
          borderTop: "1px dashed rgba(14,26,26,0.25)",
        }}
      >
        <div
          className="text-mist"
          style={{
            fontSize: 11,
            lineHeight: 1.4,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Schließt Spieltag {stNumber} ({currentDateLabel}) ab. Spieltag{" "}
          {stNumber + 1}
          {initialDate
            ? ` (${new Date(initialDate).toLocaleDateString("de-DE")})`
            : ""}{" "}
          wird automatisch angelegt.
        </div>
        <CloseGameDayButton
          gameDayId={latest.id}
          disabledReason={
            !latest.next_game_date
              ? "Bitte zuerst ein Datum für den nächsten Spieltag eingeben."
              : effectiveCount === 0
                ? "Keine bestätigten Teilnehmer."
                : null
          }
        />
      </div>
    </PhoneFrame>
  );
}
