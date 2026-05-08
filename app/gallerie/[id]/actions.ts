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

export async function updatePhotoComment(photoId: string, comment: string) {
  const supabase = await requireAdmin();
  const cleanComment = comment.trim();

  const { error } = await supabase
    .from("gallery_photos")
    .update({ comment: cleanComment === "" ? null : cleanComment })
    .eq("id", photoId);

  if (error) throw new Error(error.message);

  revalidatePath("/gallerie");
  revalidatePath(`/gallerie/${photoId}`);
}
