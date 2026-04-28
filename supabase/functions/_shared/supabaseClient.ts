import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export function getSupabaseClient(
  authHeader: string | null,
): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
  });
}
