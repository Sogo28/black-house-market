"use client";

// Quantité et commande depuis la fiche produit. Le panier arrive à l'étape 3 ;
// en attendant, la commande part sur WhatsApp avec un message déjà rédigé.

import { useState } from "react";
import { canBeOrdered, type ProductStatus } from "@/domain/availability";
import { backInStockMessage, productOrderMessage } from "@/domain/messages";
import { formatFcfa } from "@/domain/money";
import { whatsappLink } from "@/domain/phone";
import { MinusIcon, PlusIcon, WhatsAppIcon } from "./icons";

const MAX_QUANTITY = 20; // même limite que la table order_items

type OrderBoxProps = {
  productName: string;
  price: number;
  status: ProductStatus;
  shopWhatsapp: string | null;
};

export function OrderBox({ productName, price, status, shopWhatsapp }: OrderBoxProps) {
  const [quantity, setQuantity] = useState(1);

  if (!canBeOrdered(status)) {
    return (
      shopWhatsapp && (
        <a
          href={whatsappLink(shopWhatsapp, backInStockMessage(productName))}
          className="flex h-13 items-center justify-center gap-2 rounded-lg bg-ink font-semibold text-white"
        >
          <WhatsAppIcon />
          Être prévenu de son retour
        </a>
      )
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <span id="quantity-label" className="font-semibold">
          Quantité
        </span>
        <div role="group" aria-labelledby="quantity-label" className="flex items-center rounded-lg border border-line">
          <button
            type="button"
            aria-label="Retirer un article"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity === 1}
            className="flex size-12 items-center justify-center disabled:text-line"
          >
            <MinusIcon className="size-5" />
          </button>
          <span aria-live="polite" className="min-w-8 text-center text-lg font-bold">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Ajouter un article"
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            disabled={quantity === MAX_QUANTITY}
            className="flex size-12 items-center justify-center disabled:text-line"
          >
            <PlusIcon className="size-5" />
          </button>
        </div>
      </div>
      <p className="flex justify-between text-sm text-muted">
        <span>Total</span>
        <span className="font-semibold text-ink">{formatFcfa(price * quantity)}</span>
      </p>
      {shopWhatsapp && (
        <a
          href={whatsappLink(shopWhatsapp, productOrderMessage(productName, quantity, price))}
          className="flex h-13 items-center justify-center gap-2 rounded-lg bg-whatsapp font-semibold text-white"
        >
          <WhatsAppIcon />
          Commander sur WhatsApp
        </a>
      )}
    </div>
  );
}
