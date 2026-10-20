"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BagIcon } from "../icons";
import { cartDrawer } from "./drawerStore";
import { useCart } from "./cartStore";

const CLASS = "relative flex size-11 items-center justify-center rounded-lg hover:bg-white/10";

/** Icône du panier dans le bandeau : ouvre le panier latéral (sur la page /panier elle-même, elle n'y mène pas : on y est déjà). */
export function CartLink() {
  const count = useCart().reduce((sum, line) => sum + line.quantity, 0);
  const onCartPage = usePathname() === "/panier";
  const label = count > 0 ? `Panier, ${count} article${count > 1 ? "s" : ""}` : "Panier";
  const badge = count > 0 && (
    <span className="absolute right-0.5 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-xs font-bold text-ink">{count}</span>
  );

  if (onCartPage) {
    return (
      <Link href="/panier" aria-label={label} className={CLASS}>
        <BagIcon />
        {badge}
      </Link>
    );
  }
  return (
    <button type="button" onClick={cartDrawer.open} aria-label={label} aria-haspopup="dialog" className={CLASS}>
      <BagIcon />
      {badge}
    </button>
  );
}
