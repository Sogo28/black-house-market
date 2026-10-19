"use server";

import { normalizeSenegalMobile } from "@/domain/phone";
import { subscribeToRestock } from "@/infra/stockAlerts";

export type RestockState = { status: "idle" | "done" | "error"; message: string | null };

/** Le slug est lié côté serveur (bind) ; le client ne fournit que son numéro. */
export async function requestRestockAlert(slug: string, _previous: RestockState, formData: FormData): Promise<RestockState> {
  // Champ invisible : seuls les robots le remplissent.
  if (formData.get("website")) return { status: "done", message: null };

  const phone = normalizeSenegalMobile(String(formData.get("phone") ?? ""));
  if (!phone) return { status: "error", message: "Numéro invalide : 9 chiffres, par exemple 77 123 45 67." };

  try {
    const result = await subscribeToRestock(slug, phone);
    if (result === "not-sold-out") {
      return { status: "error", message: "Bonne nouvelle : ce produit est de nouveau disponible. Rechargez la page." };
    }
    if (result === "unknown-product") return { status: "error", message: "Produit introuvable." };
  } catch (error) {
    console.error(error);
    return { status: "error", message: "Votre numéro n'a pas pu être enregistré. Réessayez dans un instant." };
  }
  return { status: "done", message: null };
}
