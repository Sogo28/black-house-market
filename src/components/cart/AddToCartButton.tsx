"use client";

import { cart, useCart } from "./cartStore";
import { cartDrawer } from "./drawerStore";

/** Bouton des cartes produit : ajoute une pièce et ouvre le panier latéral. */
export function AddToCartButton({ slug }: { slug: string }) {
  const inCart = useCart().some((line) => line.slug === slug);
  const base = "flex h-11 items-center justify-center rounded-lg text-sm font-semibold";

  if (inCart) {
    return (
      <button type="button" onClick={cartDrawer.open} className={`${base} bg-sand`}>
        Dans le panier · Voir
      </button>
    );
  }
  return (
    <button type="button" onClick={() => {
        cart.add(slug, 1);
        cartDrawer.open();
      }} className={`${base} border-[1.5px] border-ink`}>
      Ajouter au panier
    </button>
  );
}
