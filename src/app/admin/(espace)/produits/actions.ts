"use server";

// Chaque action revérifie l'accès (requireAdmin). Après chaque modification, le tag
// « catalogue » est invalidé : le site public affiche le changement tout de suite.

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { STATUS_OPTIONS, validateProduct, type ProductField, type ProductInput } from "@/domain/products";
import { requireAdmin } from "@/infra/auth";
import {
  addProductImage,
  confirmSupplierProducts,
  createProduct,
  markAlertsNotified,
  removeProductImage,
  setMainProductImage,
  setProductStatus,
  updateProduct,
} from "@/infra/adminProducts";

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "");

export async function changeStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const status = STATUS_OPTIONS.find((s) => s.value === text(formData, "status"))?.value;
  if (!status) throw new Error("Statut inconnu");
  await setProductStatus(supabase, text(formData, "productId"), status);
  updateTag("catalogue");
  refresh();
}

export async function confirmSupplier(formData: FormData) {
  const { supabase } = await requireAdmin();
  await confirmSupplierProducts(supabase, text(formData, "supplierId"));
  updateTag("catalogue");
  refresh();
}

export type ProductFormState = {
  errors: Partial<Record<ProductField | "form", string>>;
  values?: ProductInput;
  saved?: boolean;
  attempt: number;
};

function readProduct(formData: FormData): ProductInput {
  return {
    name: text(formData, "name"),
    brand: text(formData, "brand"),
    description: text(formData, "description"),
    categoryId: text(formData, "categoryId"),
    supplierId: text(formData, "supplierId"),
    price: text(formData, "price"),
    oldPrice: text(formData, "oldPrice"),
    status: text(formData, "status"),
    published: formData.get("published") === "on",
  };
}

/** Création (sans productId) ou modification (avec productId). */
export async function saveProduct(previous: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const { supabase } = await requireAdmin();
  const values = readProduct(formData);
  const result = validateProduct(values);
  if (!result.ok) return { errors: result.errors, values, attempt: previous.attempt + 1 };

  const productId = text(formData, "productId");
  try {
    if (productId) {
      await updateProduct(supabase, productId, result.product);
    } else {
      const id = await createProduct(supabase, result.product);
      updateTag("catalogue");
      redirect(`/admin/produits/${id}?nouveau=1`);
    }
  } catch (error) {
    if (isRedirect(error)) throw error;
    console.error(error);
    return {
      errors: { form: "Le produit n'a pas pu être enregistré. Réessayez." },
      values,
      attempt: previous.attempt + 1,
    };
  }
  updateTag("catalogue");
  return { errors: {}, values, saved: true, attempt: previous.attempt + 1 };
}

function isRedirect(error: unknown): boolean {
  return typeof error === "object" && error !== null && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT");
}

export async function uploadImage(formData: FormData): Promise<{ error: string | null }> {
  const { supabase } = await requireAdmin();
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Aucune photo reçue." };
  const error = await addProductImage(supabase, text(formData, "productId"), file);
  if (!error) {
    updateTag("catalogue");
    refresh();
  }
  return { error };
}

export async function deleteImage(formData: FormData) {
  const { supabase } = await requireAdmin();
  await removeProductImage(supabase, text(formData, "productId"), text(formData, "path"));
  updateTag("catalogue");
  refresh();
}

export async function makeMainImageAction(formData: FormData) {
  const { supabase } = await requireAdmin();
  await setMainProductImage(supabase, text(formData, "productId"), text(formData, "path"));
  updateTag("catalogue");
  refresh();
}

export async function notifyAlertsDone(formData: FormData) {
  const { supabase } = await requireAdmin();
  await markAlertsNotified(supabase, text(formData, "productId"));
  refresh();
}
