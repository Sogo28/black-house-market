"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { AVAILABILITY_COPY, canBeOrdered, type ProductStatus } from "@/domain/availability";
import { formatFcfa } from "@/domain/money";
import { MAX_QUANTITY } from "@/domain/order";
import { MinusIcon, PlusIcon } from "../icons";
import { cart, useCart } from "./cartStore";
import { cartDrawer, useCartDrawerOpen } from "./drawerStore";

export type CartProduct = {
  slug: string;
  name: string;
  price: number;
  status: ProductStatus;
  imageUrl: string | null;
};

/**
 * Panier latéral : on voit et on corrige son panier sans quitter la page. La commande
 * (coordonnées, paiement) reste sur la page /panier, vers laquelle le tiroir renvoie.
 */
export function CartDrawer({ products }: { products: CartProduct[] }) {
  const open = useCartDrawerOpen();
  const lines = useCart();
  const dialog = useRef<HTMLDialogElement>(null);

  // <dialog> gère le focus, la touche Échap et le fond : on lui répercute seulement l'état.
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Échap ferme le <dialog> sans passer par nous : on écoute l'événement natif pour garder l'état à jour.
  useEffect(() => {
    const element = dialog.current;
    element?.addEventListener("close", cartDrawer.close);
    return () => element?.removeEventListener("close", cartDrawer.close);
  }, []);

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const items = lines.map((line) => ({ line, product: bySlug.get(line.slug) ?? null }));
  const orderable = items.filter((i): i is { line: typeof i.line; product: CartProduct } => i.product !== null && canBeOrdered(i.product.status));
  const count = orderable.reduce((sum, i) => sum + i.line.quantity, 0);
  const subtotal = orderable.reduce((sum, i) => sum + i.product.price * i.line.quantity, 0);

  return (
    <dialog
      ref={dialog}
      aria-label="Votre panier"
      onClick={(event) => {
        if (event.target === dialog.current) cartDrawer.close(); // clic sur le fond
      }}
      className="m-0 ml-auto h-dvh max-h-none w-full max-w-md bg-white p-0 text-ink backdrop:bg-black/50"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-xl font-semibold">Votre panier ({count})</h2>
          <button type="button" onClick={cartDrawer.close} aria-label="Fermer le panier" className="-mr-2 flex size-11 items-center justify-center rounded-lg hover:bg-sand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true" className="size-6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-start gap-3 p-6">
            <p className="text-lg font-semibold">Votre panier est vide</p>
            <p className="text-muted">Ajoutez des articles depuis le catalogue, ils vous attendront ici.</p>
            <button type="button" onClick={cartDrawer.close} className="mt-2 h-12 rounded-lg bg-ink px-6 font-semibold text-white">
              Continuer mes achats
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-4">
              {items.map(({ line, product }) => (
                <li key={line.slug} className="flex gap-3 py-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                    {product?.imageUrl && <Image src={product.imageUrl} alt="" fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {product ? (
                      <>
                        <Link href={`/produit/${product.slug}`} onClick={cartDrawer.close} className="font-medium leading-snug hover:underline">
                          {product.name}
                        </Link>
                        <span className={`text-xs font-semibold ${product.status === "sold_out" ? "text-muted" : product.status === "on_order" ? "text-amber" : "text-whatsapp"}`}>
                          {product.status === "sold_out" ? "Épuisé : retirez-le pour continuer" : AVAILABILITY_COPY[product.status].label}
                        </span>
                        <span className="font-bold">{formatFcfa(product.price * line.quantity)}</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted">Cet article n&apos;est plus en vente.</span>
                    )}
                    <div className="mt-1 flex items-center justify-between gap-3">
                      {product && canBeOrdered(product.status) ? (
                        <div className="flex items-center rounded-lg border border-line">
                          <button
                            type="button"
                            aria-label={`Retirer un ${product.name}`}
                            onClick={() => cart.setQuantity(line.slug, line.quantity - 1)}
                            disabled={line.quantity === 1}
                            className="flex size-11 items-center justify-center disabled:text-line"
                          >
                            <MinusIcon className="size-4" />
                          </button>
                          <span className="min-w-6 text-center font-bold">{line.quantity}</span>
                          <button
                            type="button"
                            aria-label={`Ajouter un ${product.name}`}
                            onClick={() => cart.setQuantity(line.slug, line.quantity + 1)}
                            disabled={line.quantity === MAX_QUANTITY}
                            className="flex size-11 items-center justify-center disabled:text-line"
                          >
                            <PlusIcon className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <span />
                      )}
                      <button type="button" onClick={() => cart.remove(line.slug)} className="h-11 px-1 text-sm text-muted underline">
                        Retirer
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 border-t border-line p-4">
              <div className="flex items-baseline justify-between text-lg font-semibold">
                <span>Sous-total</span>
                <span className="whitespace-nowrap">{formatFcfa(subtotal)}</span>
              </div>
              <p className="text-sm text-muted">+ frais de livraison, annoncés lors de la confirmation. Paiement à la réception.</p>
              <Link href="/panier" onClick={cartDrawer.close} className="flex h-12 items-center justify-center rounded-lg bg-gold font-semibold text-ink">
                Commander
              </Link>
              <button type="button" onClick={cartDrawer.close} className="h-11 text-sm font-semibold underline">
                Continuer mes achats
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
