import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const TILE_GRADIENTS = [
  "linear-gradient(135deg,#C94A2B,#8B3520)",
  "linear-gradient(135deg,#1E4A3C,#0E2A22)",
  "linear-gradient(135deg,#E9B63A,#A87B16)",
  "linear-gradient(135deg,#2A6A6A,#173838)",
  "linear-gradient(135deg,#8B3520,#5A2010)",
  "linear-gradient(135deg,#A87B16,#5C4408)",
];

type Photo = { id: string; storage_path: string; comment: string | null };

function publicUrl(path: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${url}/storage/v1/object/public/gallery-photos/${path}`;
}

export default async function GalleriePage() {
  const { data } = await supabase
    .from("gallery_photos")
    .select("id,storage_path,comment")
    .order("created_at", { ascending: false });

  const photos = (data ?? []) as Photo[];

  return (
    <PhoneFrame activeTab={null}>
      <BackButton href="/" />

      <div
        className="flex items-center justify-between"
        style={{ padding: "8px 14px 4px" }}
      >
        <div>
          <div
            className="font-alfa text-forest"
            style={{ fontSize: 17 }}
          >
            GALLERIE
          </div>
          <div
            className="font-oswald uppercase text-mist"
            style={{ fontSize: 11, letterSpacing: "0.08em" }}
          >
            {photos.length} {photos.length === 1 ? "Foto" : "Fotos"}
          </div>
        </div>
        {/* Kamera-Button: später admin-only, vorerst sichtbar */}
        <button
          type="button"
          className="inline-flex items-center font-oswald uppercase font-semibold"
          style={{
            gap: 8,
            padding: "10px 16px",
            background: "#C94A2B",
            color: "#F2E7CE",
            border: "2px solid #0E1A1A",
            borderRadius: 24,
            fontSize: 12,
            letterSpacing: "0.12em",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>📸</span>
          Kamera
        </button>
      </div>

      <div
        className="text-mist italic"
        style={{
          margin: "6px 14px 0",
          fontSize: 10,
          lineHeight: 1.4,
        }}
      >
        Kamera-Button öffnet die iPhone-Kamera (Admin). Nach dem Auslösen
        erscheint das Foto hier.
      </div>

      {photos.length === 0 ? (
        <div
          className="text-mist text-center italic"
          style={{ padding: "32px 14px", fontSize: 12 }}
        >
          Noch keine Fotos hochgeladen.
        </div>
      ) : (
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
            padding: "6px 14px 14px",
          }}
        >
          {photos.map((p, i) => (
            <Link
              key={p.id}
              href={`/gallerie/${p.id}`}
              className="block overflow-hidden"
              style={{
                aspectRatio: "1 / 1",
                border: "2px solid #0E1A1A",
                borderRadius: 8,
                background: p.storage_path
                  ? `center/cover no-repeat url(${publicUrl(p.storage_path)})`
                  : TILE_GRADIENTS[i % TILE_GRADIENTS.length],
              }}
            />
          ))}
        </div>
      )}
    </PhoneFrame>
  );
}
