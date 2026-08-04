import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const authOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>) => await fn(),
  },
};

/**
 * Cookie-based browser client so middleware can read the session.
 * Lock bypass prevents signIn/getUser hanging in Next.js dev (supabase-js #2111).
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, authOptions);

/** Direct client for auth calls when SSR cookie client hangs (same lock bypass). */
export function createFastAuthClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, authOptions);
}

