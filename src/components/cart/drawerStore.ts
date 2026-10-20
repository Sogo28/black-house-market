"use client";

// État ouvert/fermé du panier latéral. Un petit store comme le panier : le bouton du bandeau,
// les boutons « Ajouter au panier » et le tiroir lui-même n'ont pas de parent commun.

import { useSyncExternalStore } from "react";

let isOpen = false;
const listeners = new Set<() => void>();

function set(value: boolean) {
  if (isOpen === value) return;
  isOpen = value;
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export const cartDrawer = {
  open: () => set(true),
  close: () => set(false),
};

export function useCartDrawerOpen(): boolean {
  return useSyncExternalStore(subscribe, () => isOpen, () => false);
}
