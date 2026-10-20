import Link from "next/link";
import { formatSenegalMobile, whatsappLink } from "@/domain/phone";
import { getCategories } from "@/infra/catalogue";
import { SHOP_INSTAGRAM, SHOP_WHATSAPP } from "@/site";
import { InstagramIcon, PinIcon, WhatsAppIcon } from "./icons";
import { Logo } from "./Logo";

export async function SiteFooter() {
  const categories = await getCategories();

  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-12 gap-y-10 px-4 py-12 md:px-8">
        <div className="flex min-w-60 flex-1 flex-col gap-4">
          <Logo width={220} withTagline />
          <p className="text-sm text-white/75">Les grandes marques à prix cassés, livrées chez vous. Dakar, Sénégal.</p>
        </div>

        {categories.length > 0 && (
          <nav aria-label="Boutique" className="flex min-w-36 flex-1 flex-col">
            <h2 className="pb-2 text-xs font-semibold uppercase tracking-widest text-gold">Boutique</h2>
            {categories.map((category) => (
              <Link key={category.slug} href={`/categorie/${category.slug}`} className="py-2 text-sm hover:text-gold">
                {category.name}
              </Link>
            ))}
          </nav>
        )}

        <nav aria-label="Informations" className="flex min-w-36 flex-1 flex-col">
          <h2 className="pb-2 text-xs font-semibold uppercase tracking-widest text-gold">Informations</h2>
          <Link href="/livraison" className="py-2 text-sm hover:text-gold">
            Livraison
          </Link>
          <Link href="/echanges" className="py-2 text-sm hover:text-gold">
            Échanges et retours
          </Link>
          <Link href="/conditions" className="py-2 text-sm hover:text-gold">
            Conditions de vente
          </Link>
        </nav>

        <div className="flex min-w-52 flex-1 flex-col gap-3 text-sm">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gold">Contact</h2>
          {SHOP_WHATSAPP && (
            <a href={whatsappLink(SHOP_WHATSAPP, "Bonjour Black House !")} className="flex items-center gap-2 hover:text-gold">
              <WhatsAppIcon className="size-5" />
              +221 {formatSenegalMobile(SHOP_WHATSAPP)}
            </a>
          )}
          <a href={`https://www.instagram.com/${SHOP_INSTAGRAM}/`} className="flex items-center gap-2 hover:text-gold">
            <InstagramIcon className="size-5" />@{SHOP_INSTAGRAM}
          </a>
          <span className="flex items-center gap-2">
            <PinIcon className="size-5" />
            Dakar, Sénégal
          </span>
        </div>
      </div>
      <p className="mx-auto max-w-6xl border-t border-white/10 px-4 py-5 text-xs text-white/60 md:px-8">
        © 2026 Black House
      </p>
    </footer>
  );
}
