"use client";

// Quantité et commande depuis la fiche produit : ajout au panier, ou commande directe
// sur WhatsApp avec un message déjà rédigé.

import Link from "next/link";
import { useState } from "react";
import { canBeOrdered, type ProductStatus } from "@/domain/availability";
import { productOrderMessage } from "@/domain/messages";
import { formatFcfa } from "@/domain/money";
import { MAX_QUANTITY } from "@/domain/order";
import { whatsappLink } from "@/domain/phone";
import { cart, useCart } from "./cart/cartStore";
import { BagIcon, MinusIcon, PlusIcon, WhatsAppIcon } from "./icons";
import { RestockForm } from "./RestockForm";

type OrderBoxProps = {
  slug: string;
  productName: string;
  price: number;
  status: ProductStatus;
  shopWhatsapp: string | null;
  /** Inscription à l'alerte de retour (produit épuisé), déjà liée au produit côté serveur. */
  restockAction: React.ComponentProps<typeof RestockForm>["action"];
};

export function OrderBox({ slug, productName, price, status, shopWhatsapp, restockAction }: OrderBoxProps) {
  const [quantity, setQuantity] = useState(1);
  const inCart = useCart().find((line) => line.slug === slug);

  if (!canBeOrdered(status)) return <RestockForm action={restockAction} />;

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
      <button
        type="button"
        onClick={() => cart.add(slug, quantity)}
        className="flex h-13 items-center justify-center gap-2 rounded-lg bg-ink font-semibold text-white"
      >
        <BagIcon className="size-5" />
        Ajouter au panier · {formatFcfa(price * quantity)}
      </button>
      {inCart && (
        <p role="status" className="flex items-center justify-between rounded-lg bg-sand px-4 py-3 text-sm">
          <span>
            {inCart.quantity} dans votre panier
          </span>
          <Link href="/panier" className="font-semibold underline">
            Voir le panier
          </Link>
        </p>
      )}
      {shopWhatsapp && (
        <a
          href={whatsappLink(shopWhatsapp, productOrderMessage(productName, quantity, price))}
          className="flex h-13 items-center justify-center gap-2 rounded-lg border-[1.5px] border-whatsapp font-semibold text-whatsapp"
        >
          <WhatsAppIcon />
          Commander sur WhatsApp
        </a>
      )}
    </div>
  );
}
