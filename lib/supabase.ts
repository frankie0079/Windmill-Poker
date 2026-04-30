import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey);

export type MoneylistRow = {
  id: string;
  name: string;
  total_winnings: number;
  game_days_played: number;
  avg_per_gameday: number;
};
