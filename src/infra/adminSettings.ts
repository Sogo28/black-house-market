import "server-only";
import { randomUUID } from "node:crypto";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, slugify } from "@/domain/products";
import type { CategoryData, SupplierData } from "@/domain/settings";
import type { AdminClient } from "./auth";

// Fournisseurs et catégories. Toutes les fonctions reçoivent le client renvoyé par requireAdmin() :
// elles agissent avec les droits de Babacar, sous la RLS (tables et Storage).

const BUCKET = "product-images";
const UNIQUE_VIOLATION = "23505";

// --- Fournisseurs ----------------------------------------------------------------------

export type SupplierRow = { id: string; name: string; whatsapp: string | null; notes: string | null; productCount: number };

export async function listSuppliers(supabase: AdminClient): Promise<SupplierRow[]> {
  const { data, error } = await supabase.from("suppliers").select("id, name, whatsapp, notes, products(count)").order("name");
  if (error) throw new Error(`Lecture des fournisseurs impossible : ${error.message}`);
  return data.map((s) => ({ id: s.id, name: s.name, whatsapp: s.whatsapp, notes: s.notes, productCount: s.products[0]?.count ?? 0 }));
}

export async function createSupplier(supabase: AdminClient, supplier: SupplierData): Promise<void> {
  const { error } = await supabase.from("suppliers").insert(supplier);
  if (error) throw new Error(`Fournisseur non créé : ${error.message}`);
}

export async function updateSupplier(supabase: AdminClient, id: string, supplier: SupplierData): Promise<void> {
  const { error } = await supabase.from("suppliers").update(supplier).eq("id", id);
  if (error) throw new Error(`Fournisseur non enregistré : ${error.message}`);
}

/** Refuse de supprimer un fournisseur encore rattaché à des produits. Renvoie un message d'erreur, ou null. */
export async function deleteSupplier(supabase: AdminClient, id: string): Promise<string | null> {
  const { count, error } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("supplier_id", id);
  if (error) throw new Error(`Vérification impossible : ${error.message}`);
  if (count) return `Ce fournisseur a encore ${count} produit${count > 1 ? "s" : ""} : changez-les de fournisseur d'abord.`;
  const { error: deleteError } = await supabase.from("suppliers").delete().eq("id", id);
  if (deleteError) throw new Error(`Fournisseur non supprimé : ${deleteError.message}`);
  return null;
}

// --- Catégories ------------------------------------------------------------------------

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  hint: string | null;
  position: number;
  image: string | null;
  productCount: number;
};

export async function listCategories(supabase: AdminClient): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, hint, position, image, products(count)")
    .order("position")
    .order("name");
  if (error) throw new Error(`Lecture des catégories impossible : ${error.message}`);
  return data.map((c) => ({ ...c, productCount: c.products[0]?.count ?? 0 }));
}

/** Le slug (adresse /categorie/…) est fixé à la création et ne change plus : les liens partagés restent valables. */
export async function createCategory(supabase: AdminClient, category: CategoryData): Promise<void> {
  const base = slugify(category.name);
  for (let attempt = 1; attempt <= 20; attempt++) {
    const slug = attempt === 1 ? base : `${base}-${attempt}`;
    const { error } = await supabase.from("categories").insert({ ...category, slug });
    if (!error) return;
    if (error.code !== UNIQUE_VIOLATION) throw new Error(`Catégorie non créée : ${error.message}`);
  }
  throw new Error("Catégorie non créée : adresse déjà prise");
}

export async function updateCategory(supabase: AdminClient, id: string, category: CategoryData): Promise<void> {
  const { error } = await supabase.from("categories").update(category).eq("id", id);
  if (error) throw new Error(`Catégorie non enregistrée : ${error.message}`);
}

export async function deleteCategory(supabase: AdminClient, id: string): Promise<string | null> {
  const { data: category } = await supabase.from("categories").select("image").eq("id", id).maybeSingle();
  const { count, error } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (error) throw new Error(`Vérification impossible : ${error.message}`);
  if (count) return `Cette catégorie a encore ${count} produit${count > 1 ? "s" : ""} : déplacez-les d'abord.`;
  const { error: deleteError } = await supabase.from("categories").delete().eq("id", id);
  if (deleteError) throw new Error(`Catégorie non supprimée : ${deleteError.message}`);
  if (category?.image) await supabase.storage.from(BUCKET).remove([category.image]);
  return null;
}

/** Remplace l'image d'une catégorie. Renvoie un message d'erreur, ou null. */
export async function setCategoryImage(supabase: AdminClient, id: string, file: File): Promise<string | null> {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "Format non accepté : utilisez une photo JPEG, PNG ou WebP.";
  if (file.size > MAX_IMAGE_BYTES) return "Photo trop lourde.";

  const { data: category, error: readError } = await supabase.from("categories").select("image").eq("id", id).maybeSingle();
  if (readError || !category) return "Catégorie introuvable.";

  // Nom unique à chaque envoi : le cache d'images de Next ne ressert jamais l'ancienne version.
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `categories/${id}-${randomUUID()}.${extension}`;
  const upload = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) return `Envoi impossible : ${upload.error.message}`;

  const { error } = await supabase.from("categories").update({ image: path }).eq("id", id);
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    return `Image non enregistrée : ${error.message}`;
  }
  if (category.image) await supabase.storage.from(BUCKET).remove([category.image]);
  return null;
}

export async function removeCategoryImage(supabase: AdminClient, id: string): Promise<void> {
  const { data: category } = await supabase.from("categories").select("image").eq("id", id).maybeSingle();
  if (!category?.image) return;
  const { error } = await supabase.from("categories").update({ image: null }).eq("id", id);
  if (error) throw new Error(`Image non retirée : ${error.message}`);
  await supabase.storage.from(BUCKET).remove([category.image]);
}
