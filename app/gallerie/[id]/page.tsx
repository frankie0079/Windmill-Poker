import { notFound } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { GalleryCommentEditor } from "./GalleryCommentEditor";

export const dynamic = "force-dynamic";

function publicUrl(path: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${url}/storage/v1/object/public/gallery-photos/${path}`;
}

export default async function FotoDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ data }, authClient] = await Promise.all([
    supabase
      .from("gallery_photos")
      .select("id,storage_path,comment")
      .eq("id", id)
      .single(),
    createSupabaseServerClient(),
  ]);
  const {
    data: { user },
  } = await authClient.auth.getUser();
  const isAdmin = !!user;

  if (!data) notFound();

  const imgUrl = data.storage_path ? publicUrl(data.storage_path) : null;

  return (
    <PhoneFrame activeTab={null}>
      <BackButton href="/gallerie" label="Zurück zur Gallerie" />

      <div
        className="relative overflow-hidden flex items-end"
        style={{
          margin: "8px 14px",
          aspectRatio: "1 / 1",
          border: "2px solid #0E1A1A",
          borderRadius: 12,
          background: imgUrl
            ? `center/cover no-repeat url(${imgUrl})`
            : "linear-gradient(135deg,#1E4A3C,#0E2A22)",
        }}
      >
        <div
          className="absolute font-oswald uppercase font-semibold"
          style={{
            top: 10,
            right: 10,
            background: "rgba(14,26,26,0.6)",
            color: "#F2E7CE",
            padding: "4px 10px",
            borderRadius: 12,
            fontSize: 10,
            letterSpacing: "0.12em",
          }}
        >
          📷 Foto
        </div>
      </div>

      <div
        style={{
          margin: "8px 14px",
          padding: "12px 14px",
          background: "rgba(255,255,255,0.55)",
          border: "2px solid #0E1A1A",
          borderRadius: 10,
        }}
      >
        <div
          className="font-oswald uppercase font-semibold text-mist"
          style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            marginBottom: 4,
          }}
        >
          Kommentar
        </div>

        {isAdmin ? (
          <GalleryCommentEditor
            photoId={data.id}
            initialComment={data.comment ?? ""}
          />
        ) : (
          <div
            className="font-work text-ink"
            style={{ fontSize: 14, lineHeight: 1.4, fontWeight: 500 }}
          >
            {data.comment || (
              <span className="text-mist italic">Kein Kommentar.</span>
            )}
          </div>
        )}
      </div>

      {isAdmin && (
        <div
          className="text-mist italic"
          style={{
            margin: "0 14px 14px",
            fontSize: 10,
            lineHeight: 1.4,
          }}
        >
          Bearbeiten nur für Admin. Leser sehen Foto + Kommentar.
        </div>
      )}
    </PhoneFrame>
  );
}
