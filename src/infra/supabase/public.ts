import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

/**
 * Client sans session, avec la clé publique : il ne lit que ce que la RLS ouvre aux
 * visiteurs (vue `catalogue`, catégories). Sans cookie, il peut servir dans un `"use cache"`.
 */
export function createPublicClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase n'est pas configuré : voir .env.example");
  return createClient<Database>(env.url, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
