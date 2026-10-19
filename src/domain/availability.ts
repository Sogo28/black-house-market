// Disponibilité des produits.
//
// Babacar n'a pas de stock : un produit n'est « disponible » que s'il l'a vérifié
// récemment auprès de son fournisseur. Passé ce délai, le site l'affiche « sur commande »
// jusqu'à la prochaine vérification. La vue SQL `catalogue` applique la même règle :
// changer les deux ensemble.

export type ProductStatus = "available" | "on_order" | "sold_out";

export const STALE_AFTER_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Vrai si la dernière vérification date de plus de STALE_AFTER_DAYS (ou n'a jamais eu lieu). */
export function isStale(lastCheckedAt: Date | null, now: Date): boolean {
  if (lastCheckedAt === null) return true;
  return now.getTime() - lastCheckedAt.getTime() > STALE_AFTER_DAYS * DAY_MS;
}

/** Le statut que voit le client, à partir de celui saisi par Babacar. */
export function displayedStatus(status: ProductStatus, lastCheckedAt: Date | null, now: Date): ProductStatus {
  if (status === "available" && isStale(lastCheckedAt, now)) return "on_order";
  return status;
}

export function canBeOrdered(status: ProductStatus): boolean {
  return status !== "sold_out";
}

export const AVAILABILITY_COPY: Record<ProductStatus, { label: string; hint: string }> = {
  available: {
    label: "Disponible",
    hint: "Prêt à partir : livraison sous 24 à 48 h.",
  },
  on_order: {
    label: "Sur commande",
    hint: "Disponibilité confirmée sous 2 h, puis livraison sous 3 à 5 jours.",
  },
  sold_out: {
    label: "Épuisé",
    hint: "Laissez votre numéro : nous vous prévenons dès son retour.",
  },
};
