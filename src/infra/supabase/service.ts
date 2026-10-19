import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

/**
 * Client avec la clé secrète : il ignore la RLS. Réservé au serveur (enregistrer une
 * commande, lire une commande par son jeton de suivi). Ne jamais l'exposer au navigateur.
 */
export function createServiceClient() {
  const env = getSupabaseEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!env || !secretKey) throw new Error("Supabase n'est pas configuré : voir .env.example");
  return createClient<Database>(env.url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
