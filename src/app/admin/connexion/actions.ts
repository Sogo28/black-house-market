"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/infra/supabase/session";

export type SignInState = { error: string | null; email?: string };

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Saisissez votre e-mail et votre mot de passe.", email };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-mail ou mot de passe incorrect.", email };
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/connexion");
}
