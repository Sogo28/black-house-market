// Panier et validation du formulaire de commande. Aucune dépendance à Next ni à Supabase :
// la même validation tourne côté serveur (qui seul fait foi) et dans les tests.

import { normalizeSenegalMobile } from "./phone";

export const MAX_QUANTITY = 20; // même limite que la table order_items
export const MAX_LINES = 30;

export type CartLine = { slug: string; quantity: number };

export const COMMUNES = [
  "Dakar Plateau",
  "Médina",
  "Mermoz – Sacré-Cœur",
  "Ouakam",
  "Almadies – Ngor",
  "Parcelles Assainies",
  "Pikine",
  "Guédiawaye",
  "Rufisque",
  "Autre",
] as const;

export type PaymentMethod = "cash" | "wave" | "orange_money";

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "cash", label: "Espèces à la livraison", hint: "Vous payez le livreur en main propre." },
  { id: "wave", label: "Wave", hint: "Paiement Wave à la réception du colis." },
  { id: "orange_money", label: "Orange Money", hint: "Paiement Orange Money à la réception." },
];

/** Lit un panier venu du navigateur : fusionne les doublons, borne les quantités. Null si illisible. */
export function parseCartLines(value: unknown): CartLine[] | null {
  if (!Array.isArray(value)) return null;
  const quantities = new Map<string, number>();
  for (const line of value) {
    if (typeof line !== "object" || line === null) return null;
    const { slug, quantity } = line as Record<string, unknown>;
    if (typeof slug !== "string" || !/^[a-z0-9-]{1,120}$/.test(slug)) return null;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) return null;
    quantities.set(slug, Math.min(MAX_QUANTITY, (quantities.get(slug) ?? 0) + quantity));
  }
  if (quantities.size > MAX_LINES) return null;
  return [...quantities].map(([slug, quantity]) => ({ slug, quantity }));
}

export type OrderField = "name" | "phone" | "commune" | "address" | "payment" | "cart";

export type OrderDraft = {
  name: string;
  phone: string; // 9 chiffres, sans +221
  commune: string;
  address: string;
  payment: PaymentMethod;
  lines: CartLine[];
};

export type OrderValidation =
  | { ok: true; order: OrderDraft }
  | { ok: false; errors: Partial<Record<OrderField, string>> };

type OrderInput = Record<"name" | "phone" | "commune" | "address" | "payment" | "cart", string>;

export function validateOrder(input: OrderInput): OrderValidation {
  const errors: Partial<Record<OrderField, string>> = {};

  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) errors.name = "Indiquez votre prénom et votre nom.";

  const phone = normalizeSenegalMobile(input.phone);
  if (!phone) errors.phone = "Numéro invalide : 9 chiffres, par exemple 77 123 45 67.";

  const commune = COMMUNES.find((c) => c === input.commune);
  if (!commune) errors.commune = "Choisissez votre commune ou quartier.";

  const address = input.address.trim();
  if (address.length < 5 || address.length > 300) errors.address = "Donnez une adresse et un point de repère pour le livreur.";

  const payment = PAYMENT_METHODS.find((m) => m.id === input.payment)?.id;
  if (!payment) errors.payment = "Choisissez un mode de paiement.";

  let lines: CartLine[] | null = null;
  try {
    lines = parseCartLines(JSON.parse(input.cart));
  } catch {
    lines = null;
  }
  if (!lines || lines.length === 0) errors.cart = "Votre panier est vide.";

  if (!phone || !commune || !payment || !lines || lines.length === 0 || Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return { ok: true, order: { name, phone, commune, address, payment, lines } };
}
