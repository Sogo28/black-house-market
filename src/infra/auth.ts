import "server-only";
import { redirect } from "next/navigation";
import { createSessionClient } from "./supabase/session";

/**
 * Contrôle d'accès du back-office : à appeler au début de chaque page ET de chaque action
 * serveur (une action peut être appelée sans passer par la page). Redirige vers la
 * connexion si personne n'est connecté, ou si le compte n'est pas dans `admins`.
 */
export async function requireAdmin() {
  const supabase = await createSessionClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/connexion");

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) redirect("/admin/connexion?refus=1");

  return { supabase, email: typeof data.claims.email === "string" ? data.claims.email : null };
}

export type AdminClient = Awaited<ReturnType<typeof requireAdmin>>["supabase"];
