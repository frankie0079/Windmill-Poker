"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="font-oswald uppercase text-mist"
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        fontSize: 11,
        letterSpacing: "0.1em",
        cursor: pending ? "wait" : "pointer",
        textDecoration: "underline",
      }}
    >
      {pending ? "Abmelden …" : "Abmelden"}
    </button>
  );
}
