import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { ProductStatus } from "@/domain/availability";
import type { Database } from "./supabase/database.types";
import { getSupabaseEnv } from "./supabase/env";
import { createPublicClient } from "./supabase/public";

// Toutes les lectures publiques passent ici. Elles sont mises en cache et portent le tag
// `catalogue` : le back-office l'invalidera après chaque modification d'un produit.
// Sans Supabase configuré, elles renvoient un catalogue vide (la page l'explique).

export type Category = { slug: string; name: string; hint: string | null; /** Chemin dans le seau product-images (voir productImageUrl). */ image: string | null };

export type CatalogueProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  description: string | null;
  price: number;
  oldPrice: number | null;
  /** Chemins dans le seau `product-images` (voir productImageUrl). */
  images: string[];
  categorySlug: string;
  categoryName: string;
  /** Statut affiché au client, péremption déjà appliquée par la vue SQL. */
  status: ProductStatus;
};

const COLUMNS = "id, slug, name, brand, description, price, old_price, images, category_slug, category_name, status";

type CatalogueRow = Pick<
  Database["public"]["Views"]["catalogue"]["Row"],
  | "id"
  | "slug"
  | "name"
  | "brand"
  | "description"
  | "price"
  | "old_price"
  | "images"
  | "category_slug"
  | "category_name"
  | "status"
>;

export async function getCatalogue(): Promise<CatalogueProduct[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalogue");
  if (!getSupabaseEnv()) return [];

  const { data, error } = await createPublicClient()
    .from("catalogue")
    .select(COLUMNS)
    .order("created_at")
    .order("name");
  if (error) throw new Error(`Lecture du catalogue impossible : ${error.message}`);
  return data.map(toProduct);
}

export async function getProduct(slug: string): Promise<CatalogueProduct | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalogue");
  if (!getSupabaseEnv()) return null;

  const { data, error } = await createPublicClient().from("catalogue").select(COLUMNS).eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Lecture du produit impossible : ${error.message}`);
  return data ? toProduct(data) : null;
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalogue");
  if (!getSupabaseEnv()) return [];

  const { data, error } = await createPublicClient().from("categories").select("slug, name, hint, image").order("position");
  if (error) throw new Error(`Lecture des catégories impossible : ${error.message}`);
  return data;
}

/** URL publique d'une photo du seau `product-images`. */
export function productImageUrl(path: string): string {
  const env = getSupabaseEnv();
  if (!env) throw new Error("Supabase n'est pas configuré : voir .env.example");
  return `${env.url}/storage/v1/object/public/product-images/${path}`;
}

function toProduct(row: CatalogueRow): CatalogueProduct {
  return {
    id: required(row.id, "id"),
    slug: required(row.slug, "slug"),
    name: required(row.name, "name"),
    brand: row.brand,
    description: row.description,
    price: required(row.price, "price"),
    oldPrice: row.old_price,
    images: row.images ?? [],
    categorySlug: required(row.category_slug, "category_slug"),
    categoryName: required(row.category_name, "category_name"),
    status: required(row.status, "status"),
  };
}

// Postgres déclare toutes les colonnes d'une vue « nullable », même quand les tables
// d'origine les imposent. On vérifie au lieu de forcer le type.
function required<T>(value: T | null, column: string): T {
  if (value === null) throw new Error(`Colonne ${column} vide dans la vue catalogue`);
  return value;
}
