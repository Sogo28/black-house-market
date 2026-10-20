import Link from "next/link";
import { getCatalogue, getCategories, productImageUrl } from "@/infra/catalogue";
import { SHOP_WHATSAPP } from "@/site";
import { whatsappLink } from "@/domain/phone";
import { Suspense } from "react";
import { CartDrawer, type CartProduct } from "./cart/CartDrawer";
import { CartLink } from "./cart/CartLink";
import { SearchIcon, WhatsAppIcon } from "./icons";
import { Logo } from "./Logo";

export async function SiteHeader() {
  const [categories, catalogue] = await Promise.all([getCategories(), getCatalogue()]);
  // Le tiroir du panier ne connaît que des slugs : on lui donne de quoi les afficher (le catalogue est petit et en cache).
  const cartProducts: CartProduct[] = catalogue.map((p) => ({
    slug: p.slug,
    name: p.name,
    price: p.price,
    status: p.status,
    imageUrl: p.images[0] ? productImageUrl(p.images[0]) : null,
  }));

  return (
    <>
      <p className="bg-gold px-4 py-2 text-center text-xs font-semibold tracking-wider text-ink">
        SOLDES DE FIN D&apos;ANNÉE · PAIEMENT À LA LIVRAISON
      </p>
      <header className="sticky top-0 z-40 bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-8">
          <Link href="/" aria-label="Black House, accueil" className="mr-auto md:mr-0">
            <Logo width={210} />
          </Link>
          <form
            action="/recherche"
            role="search"
            className="order-last flex h-11 w-full items-center gap-2 rounded-lg bg-white px-3 text-muted md:order-none md:w-auto md:flex-1"
          >
            <SearchIcon className="size-5 shrink-0" />
            <input
              type="search"
              name="q"
              placeholder="Rechercher un produit, une marque…"
              aria-label="Rechercher un produit"
              className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none"
            />
          </form>
          {SHOP_WHATSAPP && (
            <a
              href={whatsappLink(SHOP_WHATSAPP, "Bonjour Black House, j'ai une question.")}
              aria-label="Nous écrire sur WhatsApp"
              className="flex h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium hover:bg-white/10"
            >
              <WhatsAppIcon />
              <span className="hidden sm:inline">Nous écrire</span>
            </a>
          )}
          <Suspense fallback={<span className="size-11" />}>
            <CartLink />
          </Suspense>
          <CartDrawer products={cartProducts} />
        </div>
        {categories.length > 0 && (
          <nav aria-label="Catégories" className="border-t border-white/10">
            {/* w-max + max-w-full : la liste se centre quand elle tient, et défile quand elle déborde. */}
            <ul className="mx-auto flex w-max max-w-full gap-0.5 overflow-x-auto px-2 md:gap-4 md:px-8">
              {categories.map((category) => (
                <li key={category.slug} className="shrink-0">
                  <Link href={`/categorie/${category.slug}`} className="block px-2 py-3.5 text-base font-semibold hover:text-gold md:px-3 md:text-lg">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    </>
  );
}
