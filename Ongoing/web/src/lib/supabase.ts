import { isSupabaseConfigured } from "./supabase-config";

export { isSupabaseConfigured };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Avoid a static @supabase/supabase-js import. Turbopack times out reading its maps.
let client: Awaited<ReturnType<typeof loadClient>> | null = null;

async function loadClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url!, anonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export async function getSupabase() {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  if (!client) client = await loadClient();
  return client;
}
