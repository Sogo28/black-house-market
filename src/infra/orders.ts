import "server-only";
import type { OrderDraft } from "@/domain/order";
import { createServiceClient } from "./supabase/service";

export type CreatedOrder = { code: string; trackingToken: string };

/** Enregistre la commande (fonction SQL create_order : prix et disponibilité relus en base). */
export async function createOrder(order: OrderDraft): Promise<CreatedOrder> {
  const { data, error } = await createServiceClient().rpc("create_order", {
    p_customer_name: order.name,
    p_customer_phone: order.phone,
    p_commune: order.commune,
    p_address_details: order.address,
    p_payment_method: order.payment,
    p_items: order.lines,
  });
  if (error) throw new Error(`Commande refusée : ${error.message}`);

  const { code, tracking_token } = data as { code: string; tracking_token: string };
  return { code, trackingToken: tracking_token };
}

export type OrderSummary = { code: string; firstName: string };

/** Ce que la page de remerciement affiche. Null si le jeton ne correspond à rien. */
export async function getOrderSummary(trackingToken: string): Promise<OrderSummary | null> {
  if (!/^[0-9a-f]{36}$/.test(trackingToken)) return null;
  const { data, error } = await createServiceClient()
    .from("orders")
    .select("code, customer_name")
    .eq("tracking_token", trackingToken)
    .maybeSingle();
  if (error) throw new Error(`Lecture de la commande impossible : ${error.message}`);
  if (!data) return null;
  return { code: data.code, firstName: data.customer_name.split(" ")[0] };
}
