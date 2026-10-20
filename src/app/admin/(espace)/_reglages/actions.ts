"use server";

// Chaque action revérifie l'accès (requireAdmin). Les changements de catégories invalident le tag
// « catalogue » : la barre de navigation et l'accueil du site sont à jour tout de suite.

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { validateCategory, validateSupplier } from "@/domain/settings";
import { requireAdmin } from "@/infra/auth";
import {
  createCategory,
  createSupplier,
  deleteCategory,
  deleteSupplier,
  removeCategoryImage,
  setCategoryImage,
  updateCategory,
  updateSupplier,
} from "@/infra/adminSettings";

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "");

export type SettingsState = {
  errors: Record<string, string>;
  /** Saisie renvoyée avec une erreur, pour que rien ne soit perdu. */
  values?: Record<string, string>;
  saved?: boolean;
  /** Change à chaque réponse : sert de clé pour reconstruire le formulaire avec la saisie. */
  attempt: number;
};

const failure = (previous: SettingsState, errors: Record<string, string>, values?: Record<string, string>): SettingsState => ({
  errors,
  values,
  attempt: previous.attempt + 1,
});

const fields = (formData: FormData, names: string[]) => Object.fromEntries(names.map((n) => [n, text(formData, n)]));

// --- Fournisseurs ------------------------------------------------------------------------

/** Création (sans id) ou modification (avec id). */
export async function saveSupplier(previous: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase } = await requireAdmin();
  const result = validateSupplier({
    name: text(formData, "name"),
    whatsapp: text(formData, "whatsapp"),
    notes: text(formData, "notes"),
  });
  if (!result.ok) return failure(previous, result.errors, fields(formData, ["name", "whatsapp", "notes"]));

  const id = text(formData, "id");
  try {
    if (id) await updateSupplier(supabase, id, result.supplier);
    else await createSupplier(supabase, result.supplier);
  } catch (error) {
    console.error(error);
    return failure(previous, { form: "Le fournisseur n'a pas pu être enregistré. Réessayez." }, fields(formData, ["name", "whatsapp", "notes"]));
  }
  // Après une création, retour à la liste ; après une modification, le formulaire confirme.
  if (!id) {
    refresh();
    redirect("/admin/fournisseurs");
  }
  refresh();
  return { errors: {}, saved: true, attempt: previous.attempt + 1 };
}

export async function removeSupplier(previous: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase } = await requireAdmin();
  const message = await deleteSupplier(supabase, text(formData, "id"));
  if (message) return failure(previous, { form: message });
  refresh();
  redirect("/admin/fournisseurs");
}

// --- Catégories --------------------------------------------------------------------------

export async function saveCategory(previous: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase } = await requireAdmin();
  const result = validateCategory({
    name: text(formData, "name"),
    hint: text(formData, "hint"),
    position: text(formData, "position"),
  });
  if (!result.ok) return failure(previous, result.errors, fields(formData, ["name", "hint", "position"]));

  const id = text(formData, "id");
  try {
    if (id) await updateCategory(supabase, id, result.category);
    else await createCategory(supabase, result.category);
  } catch (error) {
    console.error(error);
    return failure(previous, { form: "La catégorie n'a pas pu être enregistrée. Réessayez." }, fields(formData, ["name", "hint", "position"]));
  }
  updateTag("catalogue");
  if (!id) redirect("/admin/categories");
  return { errors: {}, saved: true, attempt: previous.attempt + 1 };
}

export async function removeCategory(previous: SettingsState, formData: FormData): Promise<SettingsState> {
  const { supabase } = await requireAdmin();
  const message = await deleteCategory(supabase, text(formData, "id"));
  if (message) return failure(previous, { form: message });
  updateTag("catalogue");
  redirect("/admin/categories");
}

export async function uploadCategoryImage(formData: FormData): Promise<{ error: string | null }> {
  const { supabase } = await requireAdmin();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Aucune image reçue." };
  const error = await setCategoryImage(supabase, text(formData, "id"), file);
  if (!error) {
    updateTag("catalogue");
    refresh();
  }
  return { error };
}

export async function deleteCategoryImage(formData: FormData) {
  const { supabase } = await requireAdmin();
  await removeCategoryImage(supabase, text(formData, "id"));
  updateTag("catalogue");
  refresh();
}
