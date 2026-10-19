// Suivi d'une commande par le client : étape en cours, état de chaque article et total.

export type OrderStatus =
  | "received"
  | "checking"
  | "action_required"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "cancelled";

export type ItemCheck = "pending" | "available" | "unavailable";
export type CustomerChoice = "replace" | "remove" | "cancel";

export const TRACKING_STEPS = [
  { label: "Reçue", hint: "Nous avons bien reçu votre commande." },
  { label: "En préparation", hint: "Nous vérifions chacun de vos articles." },
  { label: "Confirmée", hint: "Total et frais de livraison envoyés sur WhatsApp." },
  { label: "En livraison", hint: "Le livreur vous appelle avant d'arriver." },
  { label: "Livrée", hint: "Payée à la réception. Merci !" },
] as const;

/** Index de l'étape en cours dans TRACKING_STEPS, ou null pour une commande annulée. */
export function currentStep(status: OrderStatus): number | null {
  switch (status) {
    case "received":
      return 0;
    case "checking":
    case "action_required":
      return 1;
    case "confirmed":
      return 2;
    case "shipping":
      return 3;
    case "delivered":
      return 4;
    case "cancelled":
      return null;
  }
}

export type TrackedItem = {
  name: string;
  unitPrice: number;
  quantity: number;
  check: ItemCheck;
  choice: CustomerChoice | null;
  replacement: { name: string; price: number } | null;
};

export type LineState = "available" | "pending" | "unavailable" | "replaced" | "removed";

export type TrackedLine = {
  name: string;
  quantity: number;
  /** Montant de la ligne, null si elle ne compte pas (retirée ou en attente du choix). */
  amount: number | null;
  state: LineState;
};

export const LINE_LABELS: Record<LineState, string> = {
  available: "Disponible",
  pending: "En cours de vérification",
  unavailable: "Indisponible",
  replaced: "Remplacement accepté",
  removed: "Retiré de la commande",
};

export function trackedLine(item: TrackedItem): TrackedLine {
  const base = { name: item.name, quantity: item.quantity };
  if (item.check !== "unavailable") {
    return { ...base, amount: item.unitPrice * item.quantity, state: item.check };
  }
  if (item.choice === "replace" && item.replacement) {
    return {
      name: item.replacement.name,
      quantity: item.quantity,
      amount: item.replacement.price * item.quantity,
      state: "replaced",
    };
  }
  if (item.choice) return { ...base, amount: null, state: "removed" };
  return { ...base, amount: null, state: "unavailable" };
}

export function linesTotal(lines: TrackedLine[]): number {
  return lines.reduce((sum, line) => sum + (line.amount ?? 0), 0);
}

/** Articles manquants pour lesquels le client n'a pas encore choisi. */
export function missingItems(items: TrackedItem[]): TrackedItem[] {
  return items.filter((item) => item.check === "unavailable" && item.choice === null);
}

/** Totaux affichés pour chaque option du choix. */
export function choiceTotals(items: TrackedItem[]): { withReplacement: number | null; without: number } {
  const kept = items.filter((item) => item.check !== "unavailable");
  const without = kept.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const replaceable = missingItems(items).filter((item) => item.replacement);
  if (replaceable.length === 0) return { withReplacement: null, without };
  const extra = replaceable.reduce((sum, item) => sum + (item.replacement?.price ?? 0) * item.quantity, 0);
  return { withReplacement: without + extra, without };
}
