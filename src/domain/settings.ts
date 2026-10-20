// Réglages du back-office : fournisseurs et catégories.

import { normalizeSenegalMobile } from "./phone";

export type SupplierField = "name" | "whatsapp" | "notes";
export type SupplierInput = { name: string; whatsapp: string; notes: string };
export type SupplierData = { name: string; whatsapp: string | null; notes: string | null };

export type SupplierValidation =
  | { ok: true; supplier: SupplierData }
  | { ok: false; errors: Partial<Record<SupplierField, string>> };

export function validateSupplier(input: SupplierInput): SupplierValidation {
  const errors: Partial<Record<SupplierField, string>> = {};

  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) errors.name = "Donnez un nom de 2 à 80 caractères.";

  // Le WhatsApp est facultatif : sans lui, le bouton « Envoyer la liste » n'apparaît pas.
  let whatsapp: string | null = null;
  if (input.whatsapp.trim()) {
    whatsapp = normalizeSenegalMobile(input.whatsapp);
    if (!whatsapp) errors.whatsapp = "Numéro invalide : 9 chiffres, par exemple 77 123 45 67.";
  }

  const notes = input.notes.trim();
  if (notes.length > 500) errors.notes = "500 caractères au maximum.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, supplier: { name, whatsapp, notes: notes || null } };
}

export type CategoryField = "name" | "hint" | "position";
export type CategoryInput = { name: string; hint: string; position: string };
export type CategoryData = { name: string; hint: string | null; position: number };

export type CategoryValidation =
  | { ok: true; category: CategoryData }
  | { ok: false; errors: Partial<Record<CategoryField, string>> };

export function validateCategory(input: CategoryInput): CategoryValidation {
  const errors: Partial<Record<CategoryField, string>> = {};

  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40) errors.name = "Donnez un nom de 2 à 40 caractères.";

  const hint = input.hint.trim();
  if (hint.length > 80) errors.hint = "80 caractères au maximum.";

  const position = Number(input.position.trim() === "" ? "0" : input.position);
  if (!Number.isInteger(position) || position < 0 || position > 999) errors.position = "Un nombre entier entre 0 et 999.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, category: { name, hint: hint || null, position } };
}
