"use server";

import { refresh } from "next/cache";
import type { CustomerChoice } from "@/domain/tracking";
import { applyCustomerChoice } from "@/infra/orders";

export type ChoiceState = { error: string | null };

const CHOICES: CustomerChoice[] = ["replace", "remove", "cancel"];

/** Le jeton est lié côté serveur (bind) : le client ne fait que choisir une option. */
export async function chooseForOrder(token: string, _previous: ChoiceState, formData: FormData): Promise<ChoiceState> {
  const choice = CHOICES.find((c) => c === formData.get("choice"));
  if (!choice) return { error: "Choisissez une option." };

  try {
    await applyCustomerChoice(token, choice);
  } catch (error) {
    console.error(error);
    return { error: "Votre choix n'a pas pu être enregistré. Rechargez la page et réessayez." };
  }
  refresh();
  return { error: null };
}
