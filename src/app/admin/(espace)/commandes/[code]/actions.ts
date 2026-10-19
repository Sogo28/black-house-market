"use server";

// Chaque action revérifie l'accès (requireAdmin) et relit la commande en base : la
// transition demandée doit correspondre à nextAction(), quoi qu'affiche la page.

import { refresh } from "next/cache";
import { canCancel, nextAction } from "@/domain/backoffice";
import { requireAdmin } from "@/infra/auth";
import {
  addEvent,
  continueWithoutMissing,
  getAdminOrder,
  setItemCheck,
  setReplacement,
  updateOrder,
} from "@/infra/backoffice";

async function loadOrder(formData: FormData) {
  const { supabase } = await requireAdmin();
  const order = await getAdminOrder(supabase, String(formData.get("code") ?? ""));
  if (!order) throw new Error("Commande introuvable");
  return { supabase, order };
}

export async function checkItem(formData: FormData) {
  const { supabase, order } = await loadOrder(formData);
  if (order.status !== "received" && order.status !== "checking") throw new Error("Commande déjà vérifiée");
  const check = formData.get("check") === "available" ? "available" : "unavailable";
  const name = await setItemCheck(supabase, order.id, String(formData.get("itemId")), check);
  if (order.status === "received") await updateOrder(supabase, order.id, { status: "checking" });
  await addEvent(supabase, order.id, `${name} : ${check === "available" ? "disponible" : "indisponible"}`);
  refresh();
}

export async function chooseReplacement(formData: FormData) {
  const { supabase, order } = await loadOrder(formData);
  if (order.status !== "received" && order.status !== "checking") throw new Error("Commande déjà vérifiée");
  const replacementId = String(formData.get("replacementId") ?? "") || null;
  await setReplacement(supabase, order.id, String(formData.get("itemId")), replacementId);
  refresh();
}

export type ConfirmState = { error: string | null };

export async function confirmOrder(_previous: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const { supabase, order } = await loadOrder(formData);
  if (nextAction(order.status, order.items).kind !== "confirm") {
    return { error: "La commande n'est pas prête à être confirmée." };
  }
  const fee = Number(String(formData.get("deliveryFee") ?? "").replace(/\D/g, ""));
  if (!String(formData.get("deliveryFee") ?? "").trim() || !Number.isInteger(fee) || fee > 100000) {
    return { error: "Indiquez les frais de livraison (0 si offerts)." };
  }
  await updateOrder(supabase, order.id, { status: "confirmed", delivery_fee: fee }, "Total et livraison envoyés au client");
  refresh();
  return { error: null };
}

export async function askCustomerChoice(formData: FormData) {
  const { supabase, order } = await loadOrder(formData);
  if (nextAction(order.status, order.items).kind !== "ask-choice") throw new Error("Aucun article manquant");
  await updateOrder(supabase, order.id, { status: "action_required" }, "Choix demandé au client");
  refresh();
}

export async function continueWithout(formData: FormData) {
  const { supabase, order } = await loadOrder(formData);
  if (order.status !== "action_required") throw new Error("Aucun choix en attente");
  await continueWithoutMissing(supabase, order);
  refresh();
}

export async function markShipped(formData: FormData) {
  const { supabase, order } = await loadOrder(formData);
  if (nextAction(order.status, order.items).kind !== "ship") throw new Error("Commande pas encore confirmée");
  await updateOrder(supabase, order.id, { status: "shipping" }, "Le client a dit OK : remise au livreur");
  refresh();
}

export async function markDelivered(formData: FormData) {
  const { supabase, order } = await loadOrder(formData);
  if (nextAction(order.status, order.items).kind !== "deliver") throw new Error("Commande pas en livraison");
  await updateOrder(supabase, order.id, { status: "delivered" }, "Livrée et payée");
  refresh();
}

export async function cancelOrder(formData: FormData) {
  const { supabase, order } = await loadOrder(formData);
  if (!canCancel(order.status)) throw new Error("Commande déjà terminée");
  await updateOrder(supabase, order.id, { status: "cancelled" }, "Commande annulée par Black House");
  refresh();
}
