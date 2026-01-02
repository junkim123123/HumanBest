// @ts-nocheck
import "server-only";
import { createClient } from "@supabase/supabase-js";

let cached: ReturnType<typeof createClient> | null = null;

/**
 * Get cached Supabase admin client (recommended)
 * Use this for consistent admin client instance
 */
export function getSupabaseAdmin() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");

  cached = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return cached;
}

/**
 * Admin client using service role key (bypasses RLS)
 * Use only for server-side admin operations
 * @deprecated Use getSupabaseAdmin() instead for cached instance
 */
export function createAdminClient() {
  return getSupabaseAdmin();
}


