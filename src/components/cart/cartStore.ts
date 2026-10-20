"use client";

// Panier gardé dans le navigateur (localStorage) : pas de compte, il survit aux
// rechargements. Il ne contient que des slugs et des quantités ; les prix sont toujours
// relus côté serveur au moment de commander.

import { useSyncExternalStore } from "react";
import { MAX_QUANTITY, parseCartLines, type CartLine } from "@/domain/order";

const STORAGE_KEY = "bh-panier";
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();

// useSyncExternalStore veut le même objet tant que rien n'a changé.
let snapshot: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // navigation privée, stockage bloqué…
  }
}

function getSnapshot(): CartLine[] {
  const raw = readStorage();
  if (raw === snapshot.raw) return snapshot.lines;
  let lines: CartLine[] = EMPTY;
  try {
    lines = (raw && parseCartLines(JSON.parse(raw))) || EMPTY;
  } catch {
    lines = EMPTY;
  }
  snapshot = { raw, lines };
  return lines;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange(); // panier modifié dans un autre onglet
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function write(lines: CartLine[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    return;
  }
  listeners.forEach((listener) => listener());
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

const noopSubscribe = () => () => {};

/** Faux côté serveur et avant l'hydratation, vrai ensuite : tant que c'est faux, le panier lu n'est pas encore le vrai (squelette à afficher). */
export function useCartReady(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export const cart = {
  add(slug: string, quantity: number) {
    const lines = getSnapshot();
    const existing = lines.find((line) => line.slug === slug);
    write(
      existing
        ? lines.map((line) =>
            line.slug === slug ? { slug, quantity: Math.min(MAX_QUANTITY, line.quantity + quantity) } : line,
          )
        : [...lines, { slug, quantity: Math.min(MAX_QUANTITY, quantity) }],
    );
  },
  setQuantity(slug: string, quantity: number) {
    const clamped = Math.max(1, Math.min(MAX_QUANTITY, quantity));
    write(getSnapshot().map((line) => (line.slug === slug ? { slug, quantity: clamped } : line)));
  },
  remove(slug: string) {
    write(getSnapshot().filter((line) => line.slug !== slug));
  },
  clear() {
    write([]);
  },
};
