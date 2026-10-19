import "server-only";
import { createServiceClient } from "./supabase/service";

/**
 * Inscrit un numéro à l'alerte « me prévenir du retour ». Ne marche que pour un produit
 * publié et épuisé (relu en base). Un numéro déjà inscrit est ignoré sans erreur.
 */
export async function subscribeToRestock(slug: string, phone: string): Promise<"ok" | "unknown-product" | "not-sold-out"> {
  const supabase = createServiceClient();
  const { data: product, error } = await supabase.from("catalogue").select("id, status").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Lecture du produit impossible : ${error.message}`);
  if (!product?.id) return "unknown-product";
  if (product.status !== "sold_out") return "not-sold-out";

  const { error: insertError } = await supabase
    .from("stock_alerts")
    .upsert({ product_id: product.id, phone }, { onConflict: "product_id,phone", ignoreDuplicates: true });
  if (insertError) throw new Error(`Alerte non enregistrée : ${insertError.message}`);
  return "ok";
}
