import "server-only";
import type { OrderStatus, TrackedItem } from "@/domain/tracking";
import type { AdminClient } from "./auth";

// Lectures et écritures du back-office. Elles reçoivent le client renvoyé par
// requireAdmin() : elles agissent avec les droits de Babacar, sous la RLS.

const REPLACEMENT_FK = "products!order_items_replacement_product_id_fkey";

export type AdminOrderRow = {
  code: string;
  customerName: string;
  commune: string;
  status: OrderStatus;
  confirmBefore: string;
  createdAt: string;
  itemCount: number;
  total: number;
  checked: number;
  lines: number;
};

export async function listOrders(supabase: AdminClient, statuses: OrderStatus[]): Promise<AdminOrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `code, customer_name, commune, status, confirm_before, created_at,
       order_items (quantity, unit_price, check_status)`,
    )
    .in("status", statuses)
    .order("confirm_before")
    .limit(50);
  if (error) throw new Error(`Lecture des commandes impossible : ${error.message}`);

  return data.map((order) => ({
    code: order.code,
    customerName: order.customer_name,
    commune: order.commune,
    status: order.status,
    confirmBefore: order.confirm_before,
    createdAt: order.created_at,
    itemCount: order.order_items.reduce((sum, item) => sum + item.quantity, 0),
    total: order.order_items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    checked: order.order_items.filter((item) => item.check_status !== "pending").length,
    lines: order.order_items.length,
  }));
}

export async function countOrdersByStatus(supabase: AdminClient): Promise<Partial<Record<OrderStatus, number>>> {
  const { data, error } = await supabase.from("orders").select("status");
  if (error) throw new Error(`Comptage des commandes impossible : ${error.message}`);
  const counts: Partial<Record<OrderStatus, number>> = {};
  for (const { status } of data) counts[status] = (counts[status] ?? 0) + 1;
  return counts;
}

export type AdminOrderItem = TrackedItem & {
  id: string;
  productId: string | null;
  categoryId: string | null;
  replacementId: string | null;
  supplier: { name: string; whatsapp: string | null } | null;
};

export type AdminOrder = {
  id: string;
  code: string;
  trackingToken: string;
  customerName: string;
  customerPhone: string;
  commune: string;
  address: string;
  paymentMethod: "cash" | "wave" | "orange_money";
  status: OrderStatus;
  deliveryFee: number | null;
  confirmBefore: string;
  items: AdminOrderItem[];
  events: { message: string; createdAt: string }[];
};

export async function getAdminOrder(supabase: AdminClient, code: string): Promise<AdminOrder | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, code, tracking_token, customer_name, customer_phone, commune, address_details, payment_method,
       status, delivery_fee, confirm_before,
       order_items (id, product_id, product_name, unit_price, quantity, check_status, customer_choice, replacement_product_id, created_at,
         replacement:${REPLACEMENT_FK} (name, price),
         product:products!order_items_product_id_fkey (category_id, supplier:suppliers (name, whatsapp))),
       order_events (message, created_at)`,
    )
    .eq("code", code)
    .order("created_at", { referencedTable: "order_items" })
    .order("created_at", { referencedTable: "order_events" })
    .maybeSingle();
  if (error) throw new Error(`Lecture de la commande impossible : ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    code: data.code,
    trackingToken: data.tracking_token,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    commune: data.commune,
    address: data.address_details,
    paymentMethod: data.payment_method,
    status: data.status,
    deliveryFee: data.delivery_fee,
    confirmBefore: data.confirm_before,
    items: data.order_items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      name: item.product_name,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      check: item.check_status,
      choice: item.customer_choice,
      replacement: item.replacement,
      replacementId: item.replacement_product_id,
      categoryId: item.product?.category_id ?? null,
      supplier: item.product?.supplier ?? null,
    })),
    events: data.order_events.map((event) => ({ message: event.message, createdAt: event.created_at })),
  };
}

/** Produits proposables en remplacement : même catégorie, publiés, pas épuisés. */
export async function replacementCandidates(
  supabase: AdminClient,
  categoryIds: string[],
): Promise<{ id: string; name: string; price: number; categoryId: string }[]> {
  if (categoryIds.length === 0) return [];
  const { data, error } = await supabase
    .from("products")
    .select("id, name, price, category_id")
    .in("category_id", categoryIds)
    .eq("is_published", true)
    .neq("status", "sold_out")
    .order("name");
  if (error) throw new Error(`Lecture des produits impossible : ${error.message}`);
  return data.map((p) => ({ id: p.id, name: p.name, price: p.price, categoryId: p.category_id }));
}

export async function setItemCheck(
  supabase: AdminClient,
  orderId: string,
  itemId: string,
  check: "available" | "unavailable",
): Promise<string> {
  const { data, error } = await supabase
    .from("order_items")
    .update({ check_status: check, ...(check === "available" ? { replacement_product_id: null } : {}) })
    .eq("id", itemId)
    .eq("order_id", orderId)
    .select("product_name")
    .single();
  if (error) throw new Error(`Vérification non enregistrée : ${error.message}`);
  return data.product_name;
}

export async function setReplacement(
  supabase: AdminClient,
  orderId: string,
  itemId: string,
  replacementId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("order_items")
    .update({ replacement_product_id: replacementId })
    .eq("id", itemId)
    .eq("order_id", orderId)
    .eq("check_status", "unavailable");
  if (error) throw new Error(`Remplacement non enregistré : ${error.message}`);
}

export async function updateOrder(
  supabase: AdminClient,
  orderId: string,
  changes: { status?: OrderStatus; delivery_fee?: number },
  event?: string,
): Promise<void> {
  const { error } = await supabase.from("orders").update(changes).eq("id", orderId);
  if (error) throw new Error(`Commande non mise à jour : ${error.message}`);
  if (event) await addEvent(supabase, orderId, event);
}

export async function addEvent(supabase: AdminClient, orderId: string, message: string): Promise<void> {
  const { error } = await supabase.from("order_events").insert({ order_id: orderId, message });
  if (error) throw new Error(`Historique non enregistré : ${error.message}`);
}

/**
 * Le client n'a pas répondu (promesse affichée : « sans réponse sous 24 h, nous
 * continuons sans cet article ») : on retire les articles manquants. Annule la commande
 * s'il ne reste rien.
 */
export async function continueWithoutMissing(supabase: AdminClient, order: AdminOrder): Promise<void> {
  const { error } = await supabase
    .from("order_items")
    .update({ customer_choice: "remove" })
    .eq("order_id", order.id)
    .eq("check_status", "unavailable")
    .is("customer_choice", null);
  if (error) throw new Error(`Articles non retirés : ${error.message}`);

  const remaining = order.items.filter((item) => item.check !== "unavailable" || item.choice === "replace").length;
  await updateOrder(
    supabase,
    order.id,
    { status: remaining > 0 ? "checking" : "cancelled" },
    remaining > 0
      ? "Sans réponse du client : on continue sans les articles manquants"
      : "Sans réponse du client et plus aucun article : commande annulée",
  );
}
