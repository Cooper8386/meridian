/**
 * Supabase client — configured for v2, not called anywhere in v1.
 *
 * v1 progress storage uses localStorage exclusively (see lib/progress.ts).
 * This client exists so the v2 Supabase-backed progress module can import
 * it directly without any setup work.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cachedClient: SupabaseClient | null = null;

/**
 * Lazily creates the Supabase client. Returns null when the environment
 * variables are not set, which is the expected state throughout v1.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) {
    return cachedClient;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}
