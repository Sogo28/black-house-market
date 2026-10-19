"use client";

import { useEffect } from "react";
import { cart } from "./cartStore";

/** Vide le panier une fois la commande enregistrée (affiché sur la page de remerciement). */
export function ClearCart() {
  useEffect(() => {
    cart.clear();
  }, []);
  return null;
}
