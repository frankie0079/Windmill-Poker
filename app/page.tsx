import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { Countdown } from "@/components/Countdown";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const WEEKDAYS = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function fmtWeekday(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

async function findNextGameDate(): Promise<{
  iso: string;
  participants: number;
  waitlist: number;
} | null> {
  // Der offene ST IST der nächste Spieltag — sein played_on ist das Datum,
  // seine attendances sind die Teilnehmer. (Lifecycle: closeAndStartNext legt
  // beim Abschluss eines STs den neuen offenen ST inkl. attendances aus
  // next_game_planning an.)
  const { data } = await supabase
    .from("game_days")
    .select("id,played_on")
    .eq("is_closed", false)
    .order("played_on", { ascending: false })
    .limit(1);

  const openSt = data?.[0];
  if (!openSt) return null;

  const [att, wait] = await Promise.all([
    supabase
      .from("attendances")
      .select("id", { count: "exact", head: true })
      .eq("game_day_id", openSt.id),
    supabase
      .from("next_game_planning")
      .select("player_id", { count: "exact", head: true })
      .eq("game_day_id", openSt.id)
      .eq("role", "waitlist"),
  ]);

  return {
    iso: openSt.played_on,
    participants: att.count ?? 0,
    waitlist: wait.count ?? 0,
  };
}

export default async function Deckblatt() {
  const next = await findNextGameDate();
  // Default-Zielzeit: 19:15 lokal, wenn ein Datum existiert.
  const targetIso = next ? `${next.iso}T19:15:00` : null;

  return (
    <PhoneFrame activeTab={null}>
      {next && targetIso ? (
        <div
          className="bg-forest text-cream"
          style={{
            margin: "24px 18px 14px",
            padding: "22px 18px 20px",
            border: "2px solid #0E1A1A",
            borderRadius: 14,
            boxShadow: "0 4px 0 rgba(14,26,26,0.25)",
            textAlign: "center",
          }}
        >
          <div
            className="font-oswald uppercase font-semibold"
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              color: "#E9B63A",
              marginBottom: 6,
            }}
          >
            Nächster Spieltag
          </div>
          <div
            className="font-alfa"
            style={{
              fontSize: 30,
              lineHeight: 1,
              letterSpacing: "0.02em",
              marginBottom: 4,
            }}
          >
            {fmtDate(next.iso)}
          </div>
          <div
            className="font-oswald"
            style={{
              fontSize: 13,
              color: "#E9B63A",
              letterSpacing: "0.1em",
              marginBottom: 14,
            }}
          >
            {fmtWeekday(next.iso)} · 19:15 Uhr
          </div>
          <Countdown targetIso={targetIso} />
        </div>
      ) : (
        <div
          className="bg-forest text-cream"
          style={{
            margin: "24px 18px 14px",
            padding: "22px 18px 20px",
            border: "2px solid #0E1A1A",
            borderRadius: 14,
            textAlign: "center",
          }}
        >
          <div
            className="font-oswald uppercase font-semibold"
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              color: "#E9B63A",
              marginBottom: 6,
            }}
          >
            Nächster Spieltag
          </div>
          <div
            className="font-alfa"
            style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: "0.02em" }}
          >
            noch nicht geplant
          </div>
        </div>
      )}

      <Link
        href="/teilnehmer"
        className="flex items-center justify-between"
        style={{
          margin: "0 18px 14px",
          padding: "14px 18px",
          background: "rgba(255,255,255,0.5)",
          border: "2px solid #0E1A1A",
          borderRadius: 12,
          textDecoration: "none",
        }}
      >
        <div className="flex items-center" style={{ gap: 12 }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>👥</span>
          <div>
            <div
              className="font-oswald uppercase font-bold text-ink"
              style={{ fontSize: 14, letterSpacing: "0.12em" }}
            >
              Teilnehmer
            </div>
            <div
              className="font-work text-mist"
              style={{ fontSize: 11, letterSpacing: "0.05em", marginTop: 2 }}
            >
              {next
                ? `${next.participants} angemeldet · ${next.waitlist} auf Warteliste`
                : "noch keine Anmeldungen"}
            </div>
          </div>
        </div>
        <span className="font-oswald text-mist" style={{ fontSize: 22 }}>
          ›
        </span>
      </Link>

      <div
        className="flex justify-end"
        style={{ padding: "0 18px 16px" }}
      >
        <Link
          href="/gallerie"
          className="inline-flex items-center font-oswald uppercase font-semibold"
          style={{
            gap: 8,
            padding: "10px 16px 10px 14px",
            background: "#C94A2B",
            color: "#F2E7CE",
            border: "2px solid #0E1A1A",
            borderRadius: 24,
            boxShadow: "0 3px 0 rgba(14,26,26,0.25)",
            fontSize: 12,
            letterSpacing: "0.12em",
            textDecoration: "none",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>📷</span>
          Gallerie
        </Link>
      </div>
    </PhoneFrame>
  );
}
