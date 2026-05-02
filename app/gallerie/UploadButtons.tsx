"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function UploadButtons() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number }>({
    done: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setPending(true);
    setError(null);
    setProgress({ done: 0, total: list.length });
    const supabase = createSupabaseBrowserClient();
    let failed = 0;
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      try {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const filename = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("gallery-photos")
          .upload(filename, file, { contentType: file.type || undefined });
        if (upErr) throw upErr;
        const { error: dbErr } = await supabase
          .from("gallery_photos")
          .insert({ storage_path: filename });
        if (dbErr) throw dbErr;
      } catch (e) {
        failed++;
        if (!error) {
          setError(
            `${file.name}: ${e instanceof Error ? e.message : "Fehler"}`,
          );
        }
      } finally {
        setProgress({ done: i + 1, total: list.length });
      }
    }
    if (failed === 0) router.refresh();
    else router.refresh();
    setPending(false);
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
  }

  const btnStyle: React.CSSProperties = {
    gap: 8,
    padding: "10px 14px",
    background: "#C94A2B",
    color: "#F2E7CE",
    border: "2px solid #0E1A1A",
    borderRadius: 24,
    fontSize: 12,
    letterSpacing: "0.12em",
    cursor: pending ? "wait" : "pointer",
    opacity: pending ? 0.6 : 1,
  };

  return (
    <div className="flex flex-col items-end" style={{ gap: 4 }}>
      <div className="flex" style={{ gap: 8 }}>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={pending}
          className="inline-flex items-center font-oswald uppercase font-semibold"
          style={btnStyle}
          aria-label="Foto mit Kamera aufnehmen"
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>📸</span>
          Kamera
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          disabled={pending}
          className="inline-flex items-center font-oswald uppercase font-semibold"
          style={btnStyle}
          aria-label="Foto(s) aus Mediathek hochladen"
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>🖼️</span>
          Upload
        </button>
      </div>
      {pending && progress.total > 0 && (
        <div
          className="font-oswald uppercase text-forest"
          style={{ fontSize: 10, letterSpacing: "0.08em" }}
        >
          {progress.done} / {progress.total} hochgeladen
        </div>
      )}
      {error && (
        <div
          className="text-rust font-oswald"
          style={{
            fontSize: 11,
            background: "#F2E7CE",
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #C94A2B",
            maxWidth: 220,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
