// Règles de la gestion des produits : validation du formulaire, identifiant d'URL,
// produits à revérifier, messages WhatsApp liés au stock.

import { isStale, type ProductStatus } from "./availability";
import { formatFcfa } from "./money";
import { normalizeText } from "./catalogue";

export const MAX_IMAGES = 6;
export const MAX_IMAGE_BYTES = 2_500_000; // après réduction côté navigateur : ~300 Ko en pratique
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const MAX_PRICE = 10_000_000;

export const STATUS_OPTIONS: { value: ProductStatus; label: string; short: string }[] = [
  { value: "available", label: "Disponible", short: "Dispo" },
  { value: "on_order", label: "Sur commande", short: "Sur cmd" },
  { value: "sold_out", label: "Épuisé", short: "Épuisé" },
];

/** « Sérum éclat – 30 ml » → « serum-eclat-30-ml » (identifiant lisible dans l'URL). */
export function slugify(name: string): string {
  return (
    normalizeText(name)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80)
      .replace(/-+$/g, "") || "produit"
  );
}

/** « 9 900 », « 9900 FCFA » → 9900. Null si ce n'est pas un nombre entier. */
export function parsePrice(input: string): number | null {
  const digits = input.replace(/[\s  ]|FCFA/gi, "");
  return /^\d{1,9}$/.test(digits) ? Number(digits) : null;
}

export type ProductField = "name" | "category" | "price" | "oldPrice" | "status" | "brand" | "description";

export type ProductInput = {
  name: string;
  brand: string;
  description: string;
  categoryId: string;
  supplierId: string;
  price: string;
  oldPrice: string;
  status: string;
  published: boolean;
};

export type ProductData = {
  name: string;
  brand: string | null;
  description: string | null;
  categoryId: string;
  supplierId: string | null;
  price: number;
  oldPrice: number | null;
  status: ProductStatus;
  published: boolean;
};

export type ProductValidation =
  | { ok: true; product: ProductData }
  | { ok: false; errors: Partial<Record<ProductField, string>> };

export function validateProduct(input: ProductInput): ProductValidation {
  const errors: Partial<Record<ProductField, string>> = {};

  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) errors.name = "Donnez un nom de 2 à 120 caractères.";

  const brand = input.brand.trim();
  if (brand.length > 60) errors.brand = "60 caractères au maximum.";

  const description = input.description.trim();
  if (description.length > 2000) errors.description = "2 000 caractères au maximum.";

  if (!input.categoryId) errors.category = "Choisissez une catégorie.";

  const price = parsePrice(input.price);
  if (price === null || price < 1 || price > MAX_PRICE) errors.price = "Indiquez le prix en FCFA, par exemple 9900.";

  let oldPrice: number | null = null;
  if (input.oldPrice.trim()) {
    oldPrice = parsePrice(input.oldPrice);
    if (oldPrice === null) errors.oldPrice = "Indiquez l'ancien prix en FCFA, ou laissez vide.";
    else if (price !== null && oldPrice <= price) errors.oldPrice = "L'ancien prix doit être plus élevé que le prix.";
  }

  const status = STATUS_OPTIONS.find((s) => s.value === input.status)?.value;
  if (!status) errors.status = "Choisissez une disponibilité.";

  if (Object.keys(errors).length > 0 || price === null || !status) return { ok: false, errors };
  return {
    ok: true,
    product: {
      name,
      brand: brand || null,
      description: description || null,
      categoryId: input.categoryId,
      supplierId: input.supplierId || null,
      price,
      oldPrice,
      status,
      published: input.published,
    },
  };
}

/** Un produit à revérifier : visible « disponible » mais vérifié trop tard (ou jamais). */
export function needsRecheck(status: ProductStatus, lastCheckedAt: Date | null, now: Date): boolean {
  return status === "available" && isStale(lastCheckedAt, now);
}

/** « Vérifié aujourd'hui », « Vérifié il y a 5 j », « Jamais vérifié ». */
export function checkedLabel(lastCheckedAt: Date | null, now: Date): string {
  if (lastCheckedAt === null) return "Jamais vérifié";
  const days = Math.floor((now.getTime() - lastCheckedAt.getTime()) / 86_400_000);
  return days < 1 ? "Vérifié aujourd'hui" : `Vérifié il y a ${days} j`;
}

/** Message envoyé au fournisseur pour revérifier une liste de produits (jamais vu du client). */
export function supplierListMessage(products: { name: string; price?: number }[]): string {
  return [
    "Bonjour, pouvez-vous me confirmer la disponibilité de :",
    ...products.map((p) => `• ${p.name}`),
    "Merci !",
  ].join("\n");
}

/** Message envoyé à un client qui attendait le retour d'un produit. */
export function backInStockNotice(productName: string, price: number, url: string): string {
  return [
    `Bonjour, bonne nouvelle : « ${productName} » est de nouveau disponible chez Black House (${formatFcfa(price)}).`,
    `Pour commander : ${url}`,
  ].join("\n");
}

/** Chemin d'une photo dans le seau product-images : un dossier par produit. */
export function imagePath(productId: string, uniqueId: string, contentType: string): string {
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  return `${productId}/${uniqueId}.${extension}`;
}

/** Remet la photo choisie en première position (photo principale). */
export function makeMainImage(images: string[], path: string): string[] {
  return images.includes(path) ? [path, ...images.filter((p) => p !== path)] : images;
}
