// Règles du back-office : onglets, délai de confirmation, prochaine action possible.

import { formatFcfa } from "./money";
import { linesTotal, missingItems, trackedLine, type OrderStatus, type TrackedItem } from "./tracking";

export type AdminTab = "a-traiter" | "attente-client" | "en-livraison" | "terminees";

export const ADMIN_TABS: { key: AdminTab; label: string; statuses: OrderStatus[] }[] = [
  { key: "a-traiter", label: "À traiter", statuses: ["received", "checking"] },
  { key: "attente-client", label: "Attente client", statuses: ["action_required", "confirmed"] },
  { key: "en-livraison", label: "En livraison", statuses: ["shipping"] },
  { key: "terminees", label: "Terminées", statuses: ["delivered", "cancelled"] },
];

export function parseAdminTab(value: string | string[] | undefined): AdminTab {
  return ADMIN_TABS.find((tab) => tab.key === value)?.key ?? "a-traiter";
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Nouvelle",
  checking: "À vérifier",
  action_required: "Choix du client",
  confirmed: "Attend le OK",
  shipping: "Chez le livreur",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export type Deadline = { label: string; late: boolean };

/** « Reste 1 h 48 » ou « En retard de 10 min », pour les commandes à traiter. */
export function deadline(confirmBefore: Date, now: Date): Deadline {
  const minutes = Math.round((confirmBefore.getTime() - now.getTime()) / 60000);
  const late = minutes < 0;
  const abs = Math.abs(minutes);
  const duration = abs >= 60 ? `${Math.floor(abs / 60)} h ${String(abs % 60).padStart(2, "0")}` : `${abs} min`;
  return { label: late ? `En retard de ${duration}` : `Reste ${duration}`, late };
}

export type NextAction =
  | { kind: "verify"; remaining: number } // des articles restent à vérifier
  | { kind: "ask-choice" } // un article manque : demander au client
  | { kind: "confirm" } // tout est disponible : envoyer le total
  | { kind: "wait-choice" } // le client doit choisir sur sa page de suivi
  | { kind: "ship" } // le client a dit OK : remettre au livreur
  | { kind: "deliver" } // livrée et payée
  | { kind: "none" };

export function nextAction(status: OrderStatus, items: TrackedItem[]): NextAction {
  switch (status) {
    case "received":
    case "checking": {
      const remaining = items.filter((item) => item.check === "pending").length;
      if (remaining > 0) return { kind: "verify", remaining };
      return missingItems(items).length > 0 ? { kind: "ask-choice" } : { kind: "confirm" };
    }
    case "action_required":
      return { kind: "wait-choice" };
    case "confirmed":
      return { kind: "ship" };
    case "shipping":
      return { kind: "deliver" };
    default:
      return { kind: "none" };
  }
}

export function canCancel(status: OrderStatus): boolean {
  return status !== "delivered" && status !== "cancelled";
}

// --- Messages WhatsApp envoyés par Babacar ---------------------------------------------

type MessageOrder = { firstName: string; code: string; items: TrackedItem[]; deliveryFee: number | null };

export function confirmationMessage(order: MessageOrder): string {
  const lines = order.items.map(trackedLine).filter((line) => line.amount !== null);
  const subtotal = linesTotal(lines);
  const fee = order.deliveryFee ?? 0;
  return [
    `Bonjour ${order.firstName},`,
    `Bonne nouvelle : votre commande ${order.code} est prête.`,
    ...lines.map((line) => `• ${line.name} × ${line.quantity}`),
    `Total : ${formatFcfa(subtotal)} + ${formatFcfa(fee)} de livraison, soit ${formatFcfa(subtotal + fee)} à payer à la réception.`,
    "Répondez OK et nous lançons la livraison.",
  ].join("\n");
}

export function choiceRequestMessage(order: { firstName: string; code: string }, trackingUrl: string): string {
  return [
    `Bonjour ${order.firstName},`,
    `Un article de votre commande ${order.code} n'est plus disponible. Choisissez la suite en un clic (remplacer, continuer sans ou annuler) :`,
    trackingUrl,
  ].join("\n");
}

export function shippingMessage(order: { firstName: string; code: string }): string {
  return `Bonjour ${order.firstName}, votre commande ${order.code} est en route. Le livreur vous appellera avant d'arriver.`;
}

/** Question au fournisseur (jamais visible du client). */
export function supplierQuestion(productName: string, quantity: number): string {
  return `Bonjour, avez-vous toujours « ${productName} » en ${quantity} exemplaire${quantity > 1 ? "s" : ""} ? Merci !`;
}
