"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt");
  return supabase;
}

function revalidateAdminPaths() {
  // Player-Änderungen wirken sich auf Ranking, Spieler-Liste und Admin-Screens aus.
  revalidatePath("/admin/spielerverwaltung");
  revalidatePath("/admin/naechster");
  revalidatePath("/admin");
  revalidatePath("/spieler");
  revalidatePath("/ranking");
}

export async function createPlayer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name fehlt");

  const supabase = await requireAdmin();
  const { error } = await supabase.from("players").insert({ name });
  if (error) throw new Error(error.message);

  revalidateAdminPaths();
}

export async function togglePlayerActive(id: string, nextValue: boolean) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("players")
    .update({ is_active: nextValue })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateAdminPaths();
}

export async function deletePlayer(id: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("players").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateAdminPaths();
}
