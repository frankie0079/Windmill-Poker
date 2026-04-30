import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Player = { id: string; name: string };

export default async function SpielerListe() {
  const { data } = await supabase
    .from("players")
    .select("id,name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const players = (data ?? []) as Player[];

  return (
    <PhoneFrame activeTab="spieler">
      <div
        className="flex items-baseline justify-between"
        style={{ padding: "10px 14px 4px" }}
      >
        <div className="font-alfa text-forest" style={{ fontSize: 17 }}>
          SPIELER
        </div>
        <div
          className="font-oswald uppercase text-mist"
          style={{ fontSize: 11, letterSpacing: "0.08em" }}
        >
          {players.length} aktiv
        </div>
      </div>

      <div style={{ padding: "0 10px 10px" }}>
        {players.map((p) => (
          <Link
            key={p.id}
            href={`/spieler/${p.id}`}
            className="flex items-center justify-between font-oswald font-semibold text-ink"
            style={{
              padding: "12px 14px",
              marginBottom: 6,
              background: "#FFFCF4",
              border: "2px solid #0E1A1A",
              borderRadius: 8,
              fontSize: 17,
              textDecoration: "none",
            }}
          >
            <span>{p.name}</span>
            <span className="text-mist" style={{ fontSize: 18 }}>
              ›
            </span>
          </Link>
        ))}
      </div>
    </PhoneFrame>
  );
}
