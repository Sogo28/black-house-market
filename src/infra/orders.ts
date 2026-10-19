import "server-only";
import type { OrderDraft } from "@/domain/order";
import type { CustomerChoice, OrderStatus, TrackedItem } from "@/domain/tracking";
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

const isTrackingToken = (value: string) => /^[0-9a-f]{36}$/.test(value);

export type OrderSummary = { code: string; firstName: string };

/** Ce que la page de remerciement affiche. Null si le jeton ne correspond à rien. */
export async function getOrderSummary(trackingToken: string): Promise<OrderSummary | null> {
  if (!isTrackingToken(trackingToken)) return null;
  const { data, error } = await createServiceClient()
    .from("orders")
    .select("code, customer_name")
    .eq("tracking_token", trackingToken)
    .maybeSingle();
  if (error) throw new Error(`Lecture de la commande impossible : ${error.message}`);
  if (!data) return null;
  return { code: data.code, firstName: data.customer_name.split(" ")[0] };
}

export type TrackedOrder = {
  code: string;
  createdAt: string;
  firstName: string;
  commune: string;
  address: string;
  status: OrderStatus;
  deliveryFee: number | null;
  items: TrackedItem[];
};

/** Commande vue par le client sur sa page de suivi. Jamais mise en cache : données privées. */
export async function getTrackedOrder(trackingToken: string): Promise<TrackedOrder | null> {
  if (!isTrackingToken(trackingToken)) return null;
  const { data, error } = await createServiceClient()
    .from("orders")
    .select(
      `code, created_at, customer_name, commune, address_details, status, delivery_fee,
       order_items (product_name, unit_price, quantity, check_status, customer_choice, created_at,
         replacement:products!order_items_replacement_product_id_fkey (name, price))`,
    )
    .eq("tracking_token", trackingToken)
    .order("created_at", { referencedTable: "order_items" })
    .maybeSingle();
  if (error) throw new Error(`Lecture de la commande impossible : ${error.message}`);
  if (!data) return null;

  return {
    code: data.code,
    createdAt: data.created_at,
    firstName: data.customer_name.split(" ")[0],
    commune: data.commune,
    address: data.address_details,
    status: data.status,
    deliveryFee: data.delivery_fee,
    items: data.order_items.map((item) => ({
      name: item.product_name,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      check: item.check_status,
      choice: item.customer_choice,
      replacement: item.replacement,
    })),
  };
}

/** Enregistre le choix du client (fonction SQL apply_customer_choice). */
export async function applyCustomerChoice(trackingToken: string, choice: CustomerChoice): Promise<void> {
  if (!isTrackingToken(trackingToken)) throw new Error("Jeton de suivi invalide");
  const { error } = await createServiceClient().rpc("apply_customer_choice", {
    p_tracking_token: trackingToken,
    p_choice: choice,
  });
  if (error) throw new Error(`Choix refusé : ${error.message}`);
}
