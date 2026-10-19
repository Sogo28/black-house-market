import "server-only";
import { randomUUID } from "node:crypto";
import type { ProductStatus } from "@/domain/availability";
import { IMAGE_TYPES, imagePath, MAX_IMAGE_BYTES, MAX_IMAGES, makeMainImage, slugify, type ProductData } from "@/domain/products";
import type { AdminClient } from "./auth";

// Gestion des produits par Babacar. Toutes les fonctions reçoivent le client renvoyé par
// requireAdmin() : elles agissent avec ses droits, sous la RLS (tables et Storage).

const BUCKET = "product-images";

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  status: ProductStatus;
  lastCheckedAt: string | null;
  isPublished: boolean;
  mainImage: string | null;
  categoryName: string;
  supplierId: string | null;
  supplierName: string | null;
  supplierWhatsapp: string | null;
};

export async function listAdminProducts(supabase: AdminClient): Promise<AdminProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, name, price, status, last_checked_at, is_published, images,
       category:categories (name), supplier:suppliers (id, name, whatsapp)`,
    )
    .order("name");
  if (error) throw new Error(`Lecture des produits impossible : ${error.message}`);
  return data.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    status: p.status,
    lastCheckedAt: p.last_checked_at,
    isPublished: p.is_published,
    mainImage: p.images[0] ?? null,
    categoryName: p.category?.name ?? "",
    supplierId: p.supplier?.id ?? null,
    supplierName: p.supplier?.name ?? null,
    supplierWhatsapp: p.supplier?.whatsapp ?? null,
  }));
}

export type AdminProduct = ProductData & {
  id: string;
  slug: string;
  images: string[];
  lastCheckedAt: string | null;
};

export async function getAdminProduct(supabase: AdminClient, id: string): Promise<AdminProduct | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Lecture du produit impossible : ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    brand: data.brand,
    description: data.description,
    categoryId: data.category_id,
    supplierId: data.supplier_id,
    price: data.price,
    oldPrice: data.old_price,
    status: data.status,
    published: data.is_published,
    images: data.images,
    lastCheckedAt: data.last_checked_at,
  };
}

export async function listCategoryOptions(supabase: AdminClient) {
  const { data, error } = await supabase.from("categories").select("id, name").order("position");
  if (error) throw new Error(`Lecture des catégories impossible : ${error.message}`);
  return data;
}

export async function listSupplierOptions(supabase: AdminClient) {
  const { data, error } = await supabase.from("suppliers").select("id, name").order("name");
  if (error) throw new Error(`Lecture des fournisseurs impossible : ${error.message}`);
  return data;
}

/** Le statut saisi devient la vérité du jour : la date de vérification est remise à maintenant. */
export async function setProductStatus(supabase: AdminClient, id: string, status: ProductStatus): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ status, last_checked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`Statut non enregistré : ${error.message}`);
}

/** Le fournisseur a tout confirmé : on remet la date à maintenant, sans toucher aux statuts. */
export async function confirmSupplierProducts(supabase: AdminClient, supplierId: string): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ last_checked_at: new Date().toISOString() })
    .eq("supplier_id", supplierId)
    .neq("status", "sold_out");
  if (error) throw new Error(`Vérification non enregistrée : ${error.message}`);
}

const UNIQUE_VIOLATION = "23505";

/** Crée le produit. Si l'identifiant d'URL existe déjà, ajoute -2, -3… */
export async function createProduct(supabase: AdminClient, product: ProductData): Promise<string> {
  const base = slugify(product.name);
  for (let attempt = 1; attempt <= 20; attempt++) {
    const slug = attempt === 1 ? base : `${base}-${attempt}`;
    const { data, error } = await supabase
      .from("products")
      .insert({ ...toRow(product), slug, last_checked_at: new Date().toISOString() })
      .select("id")
      .single();
    if (!error) return data.id;
    if (error.code !== UNIQUE_VIOLATION) throw new Error(`Produit non créé : ${error.message}`);
  }
  throw new Error("Produit non créé : identifiant d'URL déjà pris");
}

/** Le slug ne change jamais après la création : les liens déjà partagés restent valables. */
export async function updateProduct(supabase: AdminClient, id: string, product: ProductData): Promise<void> {
  const { error } = await supabase.from("products").update(toRow(product)).eq("id", id);
  if (error) throw new Error(`Produit non enregistré : ${error.message}`);
}

function toRow(product: ProductData) {
  return {
    name: product.name,
    brand: product.brand,
    description: product.description,
    category_id: product.categoryId,
    supplier_id: product.supplierId,
    price: product.price,
    old_price: product.oldPrice,
    status: product.status,
    is_published: product.published,
  };
}

// --- Photos ---------------------------------------------------------------------------

/** Dépose une photo dans le Storage et l'ajoute au produit. Renvoie un message d'erreur, ou null. */
export async function addProductImage(supabase: AdminClient, productId: string, file: File): Promise<string | null> {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "Format non accepté : utilisez une photo JPEG, PNG ou WebP.";
  if (file.size > MAX_IMAGE_BYTES) return "Photo trop lourde.";

  const product = await getAdminProduct(supabase, productId);
  if (!product) return "Produit introuvable.";
  if (product.images.length >= MAX_IMAGES) return `${MAX_IMAGES} photos au maximum par produit.`;

  const path = imagePath(productId, randomUUID(), file.type);
  const upload = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) return `Envoi impossible : ${upload.error.message}`;

  const { error } = await supabase
    .from("products")
    .update({ images: [...product.images, path] })
    .eq("id", productId);
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]); // ne pas laisser de fichier orphelin
    return `Photo non enregistrée : ${error.message}`;
  }
  return null;
}

export async function removeProductImage(supabase: AdminClient, productId: string, path: string): Promise<void> {
  const product = await getAdminProduct(supabase, productId);
  if (!product || !product.images.includes(path)) return;
  const { error } = await supabase
    .from("products")
    .update({ images: product.images.filter((p) => p !== path) })
    .eq("id", productId);
  if (error) throw new Error(`Photo non retirée : ${error.message}`);
  // Le produit ne référence plus la photo : un échec ici laisse seulement un fichier orphelin.
  const { data, error: removeError } = await supabase.storage.from(BUCKET).remove([path]);
  if (removeError || !data || data.length === 0) {
    console.error(`Fichier non supprimé du stockage : ${path}`, removeError?.message ?? "introuvable ou refusé");
  }
}

export async function setMainProductImage(supabase: AdminClient, productId: string, path: string): Promise<void> {
  const product = await getAdminProduct(supabase, productId);
  if (!product) return;
  const { error } = await supabase.from("products").update({ images: makeMainImage(product.images, path) }).eq("id", productId);
  if (error) throw new Error(`Photo principale non enregistrée : ${error.message}`);
}

// --- Alertes « me prévenir » -----------------------------------------------------------

export async function listPendingAlerts(supabase: AdminClient, productId: string) {
  const { data, error } = await supabase
    .from("stock_alerts")
    .select("id, phone, created_at")
    .eq("product_id", productId)
    .is("notified_at", null)
    .order("created_at");
  if (error) throw new Error(`Lecture des alertes impossible : ${error.message}`);
  return data;
}

export async function countPendingAlerts(supabase: AdminClient): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("stock_alerts").select("product_id").is("notified_at", null);
  if (error) throw new Error(`Lecture des alertes impossible : ${error.message}`);
  const counts: Record<string, number> = {};
  for (const { product_id } of data) counts[product_id] = (counts[product_id] ?? 0) + 1;
  return counts;
}

export async function markAlertsNotified(supabase: AdminClient, productId: string): Promise<void> {
  const { error } = await supabase
    .from("stock_alerts")
    .update({ notified_at: new Date().toISOString() })
    .eq("product_id", productId)
    .is("notified_at", null);
  if (error) throw new Error(`Alertes non marquées : ${error.message}`);
}
