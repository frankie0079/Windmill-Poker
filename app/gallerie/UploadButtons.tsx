"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function UploadButtons() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setPending(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
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
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setPending(false);
      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
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
    <div className="flex" style={{ gap: 8 }}>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
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
        aria-label="Foto aus Mediathek hochladen"
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>🖼️</span>
        Mediathek
      </button>
      {error && (
        <div
          className="text-rust font-oswald"
          style={{
            position: "absolute",
            right: 14,
            top: 60,
            fontSize: 11,
            background: "#F2E7CE",
            padding: "4px 8px",
            borderRadius: 6,
            border: "1px solid #C94A2B",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
