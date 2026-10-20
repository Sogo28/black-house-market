"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const PAGES = [
  { href: "/admin", label: "Commandes" },
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/fournisseurs", label: "Fournisseurs" },
];

const isCurrent = (pathname: string, href: string) => (href === "/admin" ? pathname === href || pathname.startsWith("/admin/commandes") : pathname.startsWith(href));

/** Pages du back-office : onglets sur grand écran, menu hamburger sur mobile (avec Boutique et Déconnexion). */
export function AdminNav({ signOut }: { signOut: () => Promise<void> }) {
  const pathname = usePathname();
  // Le menu mémorise la page où il a été ouvert : dès qu'on change de page, il est refermé.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;

  return (
    <>
      <nav aria-label="Sections du back-office" className="hidden gap-4 md:flex">
        {PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            aria-current={isCurrent(pathname, page.href) ? "page" : undefined}
            className="border-b-2 border-transparent px-3 py-4 text-lg font-semibold hover:text-gold aria-[current=page]:border-gold"
          >
            {page.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-1 text-sm">
        <Link href="/" className="hidden whitespace-nowrap rounded-lg px-3 py-3 hover:bg-white/10 md:block">
          Boutique
        </Link>
        <form action={signOut} className="hidden md:block">
          <button type="submit" className="whitespace-nowrap rounded-lg px-3 py-3 hover:bg-white/10">
            Déconnexion
          </button>
        </form>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="admin-menu"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpenedOn(open ? null : pathname)}
          className="flex size-11 items-center justify-center rounded-lg hover:bg-white/10 md:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true" className="size-6">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="admin-menu" aria-label="Menu du back-office" className="absolute inset-x-0 top-full flex flex-col border-t border-white/10 bg-ink px-4 pb-3 shadow-lg md:hidden">
          {PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              aria-current={isCurrent(pathname, page.href) ? "page" : undefined}
              className="rounded-lg px-3 py-3.5 text-lg font-semibold aria-[current=page]:text-gold"
            >
              {page.label}
            </Link>
          ))}
          <hr className="my-2 border-white/10" />
          <Link href="/" className="rounded-lg px-3 py-3.5 text-lg">
            Voir la boutique
          </Link>
          <form action={signOut}>
            <button type="submit" className="w-full rounded-lg px-3 py-3.5 text-left text-lg">
              Déconnexion
            </button>
          </form>
        </nav>
      )}
    </>
  );
}
