"use client";

import Link from "next/link";
import { cart, useCart } from "./cartStore";

/** Bouton des cartes produit : ajoute une pièce, puis propose d'aller au panier. */
export function AddToCartButton({ slug }: { slug: string }) {
  const inCart = useCart().some((line) => line.slug === slug);
  const base = "flex h-11 items-center justify-center rounded-lg text-sm font-semibold";

  if (inCart) {
    return (
      <Link href="/panier" className={`${base} bg-sand`}>
        Dans le panier · Voir
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => cart.add(slug, 1)} className={`${base} border-[1.5px] border-ink`}>
      Ajouter au panier
    </button>
  );
}
