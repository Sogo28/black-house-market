import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

/**
 * Client lié à la session de l'utilisateur connecté (cookies) : il agit avec ses droits,
 * donc sous la RLS. C'est le client du back-office.
 */
export async function createSessionClient() {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase n'est pas configuré : voir .env.example");
  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un composant serveur, qui ne peut pas écrire de cookie :
          // src/proxy.ts rafraîchit la session avant chaque page du back-office.
        }
      },
    },
  });
}
