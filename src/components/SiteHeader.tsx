import Link from "next/link";
import { getCategories } from "@/infra/catalogue";
import { SHOP_WHATSAPP } from "@/site";
import { whatsappLink } from "@/domain/phone";
import { CartLink } from "./cart/CartLink";
import { SearchIcon, WhatsAppIcon } from "./icons";
import { Logo } from "./Logo";

export async function SiteHeader() {
  const categories = await getCategories();

  return (
    <>
      <p className="bg-gold px-4 py-2 text-center text-xs font-semibold tracking-wider text-ink">
        SOLDES DE FIN D&apos;ANNÉE · PAIEMENT À LA LIVRAISON
      </p>
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-8">
          <Link href="/" aria-label="Black House, accueil" className="mr-auto md:mr-0">
            <Logo width={170} />
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
          <CartLink />
        </div>
        {categories.length > 0 && (
          <nav aria-label="Catégories" className="border-t border-white/10">
            <ul className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 md:px-8">
              {categories.map((category) => (
                <li key={category.slug} className="shrink-0">
                  <Link href={`/categorie/${category.slug}`} className="block py-3 text-sm font-medium hover:text-gold">
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
