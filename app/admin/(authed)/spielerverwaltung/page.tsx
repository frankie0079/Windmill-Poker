import { PhoneFrame } from "@/components/PhoneFrame";
import { BackButton } from "@/components/BackButton";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createPlayer } from "./actions";
import { PlayerRow } from "./PlayerRow";

export const dynamic = "force-dynamic";

type Player = { id: string; name: string; is_active: boolean };
type Attendance = { player_id: string; game_day_id: string };

export default async function SpielerverwaltungPage() {
  const supabase = await createSupabaseServerClient();

  const [playersRes, attRes] = await Promise.all([
    supabase
      .from("players")
      .select("id, name, is_active")
      .order("is_active", { ascending: false })
      .order("name", { ascending: true }),
    supabase.from("attendances").select("player_id, game_day_id"),
  ]);

  const players = (playersRes.data ?? []) as Player[];
  const attendances = (attRes.data ?? []) as Attendance[];

  const stCount = new Map<string, number>();
  for (const a of attendances) {
    const set = stCount.get(a.player_id) ?? 0;
    stCount.set(a.player_id, set + 1);
  }

  const total = players.length;
  const active = players.filter((p) => p.is_active).length;
  const inactive = total - active;

  return (
    <PhoneFrame activeTab="admin">
      <BackButton href="/admin/naechster" label="Zurück" />

      <div style={{ padding: "8px 14px 2px" }}>
        <div className="font-alfa text-forest" style={{ fontSize: 17 }}>
          SPIELERVERWALTUNG
        </div>
        <div
          className="font-oswald text-mist uppercase"
          style={{ fontSize: 12, letterSpacing: "0.08em" }}
        >
          {total} Spieler · {active} aktiv · {inactive} inaktiv
        </div>
        <div
          className="text-slate"
          style={{ fontSize: 11, marginTop: 4, lineHeight: 1.4 }}
        >
          Inaktive Spieler erscheinen nicht in Rankings/Statistiken. Reaktivieren
          stellt Daten wieder her.
        </div>
      </div>

      <form
        action={createPlayer}
        className="flex items-center"
        style={{
          margin: "8px 14px 4px",
          padding: 10,
          gap: 8,
          border: "2px dashed rgba(14,26,26,0.35)",
          borderRadius: 8,
          background: "rgba(255,255,255,0.3)",
        }}
      >
        <input
          name="name"
          type="text"
          placeholder="Neuer Spielername"
          required
          className="font-oswald"
          style={{
            flex: 1,
            padding: "8px 10px",
            fontSize: 13,
            background: "#F2E7CE",
            color: "#0E1A1A",
            border: "2px solid #0E1A1A",
            borderRadius: 6,
            outline: "none",
          }}
        />
        <button
          type="submit"
          className="font-oswald uppercase font-semibold"
          style={{
            padding: "8px 14px",
            background: "#1E4A3C",
            color: "#F2E7CE",
            border: "2px solid #0E1A1A",
            borderRadius: 6,
            fontSize: 11,
            letterSpacing: "0.1em",
            cursor: "pointer",
          }}
        >
          + Anlegen
        </button>
      </form>

      <div style={{ padding: "4px 14px 14px" }}>
        <table className="w-full border-collapse" style={{ fontSize: 13 }}>
          <thead>
            <tr
              className="font-oswald uppercase text-mist font-semibold"
              style={{ fontSize: 10, letterSpacing: "0.12em" }}
            >
              <th
                style={{
                  padding: "5px 0",
                  borderBottom: "2px solid rgba(14,26,26,0.35)",
                  textAlign: "left",
                }}
              >
                Spieler
              </th>
              <th
                style={{
                  padding: "5px 0",
                  borderBottom: "2px solid rgba(14,26,26,0.35)",
                  textAlign: "center",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "5px 0",
                  borderBottom: "2px solid rgba(14,26,26,0.35)",
                  textAlign: "right",
                }}
              >
                ST
              </th>
              <th
                style={{
                  padding: "5px 0",
                  borderBottom: "2px solid rgba(14,26,26,0.35)",
                  width: 32,
                }}
              />
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <PlayerRow
                key={p.id}
                id={p.id}
                name={p.name}
                isActive={p.is_active}
                gameDays={stCount.get(p.id) ?? 0}
                isLast={i === players.length - 1}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          padding: "4px 14px 14px",
          marginTop: "auto",
          textAlign: "center",
        }}
      >
        <LogoutButton />
      </div>
    </PhoneFrame>
  );
}
