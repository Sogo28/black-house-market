// Messages WhatsApp pré-rédigés, envoyés par le client.

import { formatFcfa } from "./money";

export function productOrderMessage(productName: string, quantity: number, unitPrice: number): string {
  return `Bonjour Black House, je souhaite commander : ${productName} × ${quantity} (${formatFcfa(unitPrice * quantity)}). Est-ce disponible ?`;
}
