"use client";

import { useState, useTransition } from "react";
import { updatePhotoComment } from "./actions";

export function GalleryCommentEditor({
  photoId,
  initialComment,
}: {
  photoId: string;
  initialComment: string;
}) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(initialComment);
  const [displayComment, setDisplayComment] = useState(initialComment);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function cancelEdit() {
    setComment(displayComment);
    setError(null);
    setEditing(false);
  }

  function saveComment() {
    setError(null);
    startTransition(async () => {
      try {
        await updatePhotoComment(photoId, comment);
        const cleaned = comment.trim();
        setComment(cleaned);
        setDisplayComment(cleaned);
        setEditing(false);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Kommentar konnte nicht gespeichert werden.",
        );
      }
    });
  }

  return (
    <>
      {editing ? (
        <div style={{ marginTop: 8 }}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={pending}
            rows={4}
            className="font-work text-ink"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 12px",
              background: "#F8F0DC",
              border: "2px solid #0E1A1A",
              borderRadius: 8,
              fontSize: 14,
              lineHeight: 1.35,
              resize: "vertical",
            }}
            aria-label="Kommentar bearbeiten"
          />
          {error && (
            <div
              className="font-oswald text-rust"
              style={{ fontSize: 11, marginTop: 6 }}
            >
              {error}
            </div>
          )}
          <div className="flex justify-end" style={{ gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={pending}
              className="font-oswald uppercase font-semibold text-mist"
              style={{
                padding: "7px 12px",
                background: "transparent",
                border: "2px solid #7A8380",
                borderRadius: 6,
                fontSize: 10,
                letterSpacing: "0.1em",
                cursor: pending ? "wait" : "pointer",
              }}
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={saveComment}
              disabled={pending}
              className="font-oswald uppercase font-semibold"
              style={{
                padding: "7px 12px",
                background: "#1E4A3C",
                color: "#F2E7CE",
                border: "2px solid #0E1A1A",
                borderRadius: 6,
                fontSize: 10,
                letterSpacing: "0.1em",
                cursor: pending ? "wait" : "pointer",
              }}
            >
              {pending ? "Speichert..." : "Speichern"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className="font-work text-ink"
            style={{ fontSize: 14, lineHeight: 1.4, fontWeight: 500 }}
          >
            {displayComment || (
              <span className="text-mist italic">Kein Kommentar.</span>
            )}
          </div>
          <div className="flex justify-end" style={{ marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-oswald uppercase font-semibold text-forest"
              style={{
                padding: "6px 12px",
                background: "transparent",
                border: "2px solid #1E4A3C",
                borderRadius: 6,
                fontSize: 10,
                letterSpacing: "0.1em",
                cursor: "pointer",
              }}
            >
              Bearbeiten
            </button>
          </div>
        </>
      )}
    </>
  );
}
