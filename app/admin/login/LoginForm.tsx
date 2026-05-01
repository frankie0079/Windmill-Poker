"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    fontSize: 13,
    fontFamily: "var(--font-oswald), sans-serif",
    background: "#F2E7CE",
    color: "#0E1A1A",
    border: "2px solid #0E1A1A",
    borderRadius: 6,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-oswald), sans-serif",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: 10,
    color: "#6A7575",
    fontWeight: 600,
    marginBottom: 4,
    marginTop: 10,
  };

  return (
    <form onSubmit={handleSubmit}>
      <label style={labelStyle} htmlFor="email">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />

      <label style={labelStyle} htmlFor="password">
        Passwort
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      {error && (
        <div
          className="text-rust font-oswald"
          style={{
            fontSize: 12,
            marginTop: 10,
            padding: "6px 8px",
            border: "1px solid #C94A2B",
            borderRadius: 6,
            background: "rgba(201,74,43,0.08)",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          width: "100%",
          padding: 13,
          marginTop: 14,
          background: "#1E4A3C",
          color: "#F2E7CE",
          border: "2px solid #0E1A1A",
          borderRadius: 8,
          fontFamily: "var(--font-oswald), sans-serif",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontSize: 13,
          fontWeight: 600,
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? "Anmelden …" : "Anmelden"}
      </button>
    </form>
  );
}
