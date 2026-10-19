"use client";

import Link from "next/link";
import { BagIcon } from "../icons";
import { useCart } from "./cartStore";

export function CartLink() {
  const count = useCart().reduce((sum, line) => sum + line.quantity, 0);
  return (
    <Link
      href="/panier"
      aria-label={count > 0 ? `Panier, ${count} article${count > 1 ? "s" : ""}` : "Panier"}
      className="relative flex size-11 items-center justify-center rounded-lg hover:bg-white/10"
    >
      <BagIcon />
      {count > 0 && (
        <span className="absolute right-0.5 top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink">
          {count}
        </span>
      )}
    </Link>
  );
}
