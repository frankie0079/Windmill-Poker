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

  // Letzter (jüngster) Spieltag — der trägt die Planung.
  const { data: latestArr } = await supabase
    .from("game_days")
    .select("id, played_on, next_game_date, is_closed")
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

  // Mode-Detection:
  // State A = offener ST ohne round_results. Planning beschreibt diesen ST
  //   selbst, Datum-Input ändert played_on, kein Abschließen-Button.
  // State B = closed ST oder offen + Results vorhanden. Planning beschreibt
  //   den NÄCHSTEN (zu erstellenden) ST, Datum-Input setzt next_game_date,
  //   Abschließen-Button erstellt den neuen ST.
  let isStateA = false;
  if (!latest.is_closed) {
    const { count: rrCount } = await supabase
      .from("round_results")
      .select("*", { count: "exact", head: true })
      .eq("game_day_id", latest.id);
    isStateA = (rrCount ?? 0) === 0;
  }

  const { data: planRaw } = await supabase
    .from("next_game_planning")
    .select(
      "game_day_id, player_id, role, status, waitlist_rank, players(name, is_active)",
    )
    .eq("game_day_id", latest.id)
    .order("role", { ascending: true })
    .order("waitlist_rank", { ascending: true });
  const plan = ((planRaw ?? []) as unknown as PlanRow[]).filter(
    (p) => p.players?.is_active === true,
  );

  const participants = plan.filter((p) => p.role === "participant");
  const waitlist = plan
    .filter((p) => p.role === "waitlist")
    .sort((a, b) => (a.waitlist_rank ?? 99) - (b.waitlist_rank ?? 99));

  const confirmedCount = participants.filter((p) => p.status === "confirmed").length;
  const cancelledCount = participants.filter((p) => p.status === "cancelled").length;
  const promotedPlayerIds = new Set(
    waitlist.slice(0, cancelledCount).map((w) => w.player_id),
  );
  const effectiveCount = confirmedCount + promotedPlayerIds.size;
  // Nicht-leere Liste UND alle Plätze besetzt (cancelled durch Wartelistler
  // ersetzt). Mit 0 Teilnehmern ist nichts "bereit" — sonst wäre der Status
  // bei leerer Planung trügerisch grün.
  const isReady = participants.length > 0 && effectiveCount >= participants.length;

  // Datum, das der Date-Input rendert: in State A das played_on des offenen
  // STs (Frank kann verschieben), in State B das next_game_date.
  const initialDate = isStateA
    ? latest.played_on
    : (latest.next_game_date ?? "");
  const promotedNames = waitlist
    .filter((w) => promotedPlayerIds.has(w.player_id))
    .map((w) => w.players?.name ?? "?")
    .join(", ");

  // In State A planen wir den ST der GERADE als latest existiert (stNumber),
  // in State B den noch nicht existenten ST danach (stNumber + 1).
  const planningStNumber = isStateA ? stNumber : stNumber + 1;
  const stNumberHeader = isStateA
    ? `ST ${stNumber}`
    : `ST ${stNumber} → ST ${stNumber + 1}`;
  const headline = "NÄCHSTER SPIELTAG";

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
          {headline}
        </div>
        <div
          className="font-oswald text-mist"
          style={{ fontSize: 12, letterSpacing: "0.08em" }}
        >
          {stNumberHeader}
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
            Teilnehmer ST {planningStNumber}
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

      {waitlist.length > 0 && (
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
      )}

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

      {!isStateA && (
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
            Schließt Spieltag {stNumber} (
            {new Date(latest.played_on).toLocaleDateString("de-DE")}) ab.
            Spieltag {stNumber + 1}
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
      )}

      {isStateA && (
        <div
          style={{
            margin: "10px 14px 14px",
            paddingTop: 12,
            borderTop: "1px dashed rgba(14,26,26,0.25)",
            textAlign: "center",
          }}
        >
          <div
            className="text-mist"
            style={{ fontSize: 11, lineHeight: 1.4 }}
          >
            Anpassungen sind bis zum Spielabend möglich. R1 + R2 dann in der
            Eingabe-Maske.
          </div>
        </div>
      )}
    </PhoneFrame>
  );
}
