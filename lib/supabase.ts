import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy-Init: Client wird erst beim ersten Aufruf erstellt, nicht beim
// Module-Load. Verhindert dass der Vercel-Build crasht, wenn die page
// configuration collection das Modul importiert ohne dass die ENV
// zur Verfügung stehen.
let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase ENV missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  cached = createClient(url, anonKey);
  return cached;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});

export type MoneylistRow = {
  id: string;
  name: string;
  total_winnings: number;
  game_days_played: number;
  avg_per_gameday: number;
};
