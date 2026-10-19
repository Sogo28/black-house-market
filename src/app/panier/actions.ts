"use server";

import { redirect } from "next/navigation";
import { validateOrder, type OrderField } from "@/domain/order";
import { createOrder } from "@/infra/orders";

export type CheckoutState = {
  errors: Partial<Record<OrderField | "form", string>>;
  /** Saisie renvoyée au formulaire pour ne rien perdre en cas d'erreur. */
  values?: Record<OrderField, string>;
  /** Change à chaque réponse : sert de clé pour reconstruire le formulaire avec la saisie. */
  attempt: number;
};

export async function placeOrder(previous: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const field = (name: string) => String(formData.get(name) ?? "");

  // Champ invisible : seuls les robots le remplissent.
  if (field("website")) return { errors: {}, attempt: previous.attempt + 1 };

  const values = {
    name: field("name"),
    phone: field("phone"),
    commune: field("commune"),
    address: field("address"),
    payment: field("payment"),
    cart: field("cart"),
  };
  const result = validateOrder(values);
  if (!result.ok) return { errors: result.errors, values, attempt: previous.attempt + 1 };

  let trackingToken: string;
  try {
    ({ trackingToken } = await createOrder(result.order));
  } catch (error) {
    console.error(error);
    return {
      errors: {
        form: "La commande n'a pas pu être envoyée : un article n'est peut-être plus disponible. Vérifiez votre panier et réessayez.",
      },
      values,
      attempt: previous.attempt + 1,
    };
  }
  redirect(`/merci/${trackingToken}`);
}
