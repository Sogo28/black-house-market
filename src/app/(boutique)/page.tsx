import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CashIcon, CheckCircleIcon, TruckIcon, WhatsAppIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product";
import { sortProducts } from "@/domain/catalogue";
import { discountPercent } from "@/domain/money";
import { whatsappLink } from "@/domain/phone";
import { getCatalogue, getCategories, productImageUrl } from "@/infra/catalogue";
import { getSupabaseEnv } from "@/infra/supabase/env";
import { SHOP_WHATSAPP } from "@/site";

const OFFERS_COUNT = 8;

const PROMISES = [
  { icon: CashIcon, label: "Paiement à la réception" },
  { icon: TruckIcon, label: "Livraison à domicile" },
  { icon: CheckCircleIcon, label: "Disponibilité vérifiée avant l'envoi" },
  { icon: WhatsAppIcon, label: "Confirmation sur WhatsApp" },
];

const STEPS = [
  { title: "Choisissez vos articles", text: "Ajoutez-les au panier, sans créer de compte." },
  { title: "Nous vérifions et confirmons", text: "Réponse sur WhatsApp sous 2 h, avec le total et la livraison." },
  { title: "Payez à la réception", text: "En espèces, Wave ou Orange Money." },
];

export default async function HomePage() {
  const [products, categories] = await Promise.all([getCatalogue(), getCategories()]);
  const offers = sortProducts(
    products.filter((p) => discountPercent(p.price, p.oldPrice) !== null),
    "remise",
  ).slice(0, OFFERS_COUNT);

  return (
    <main>
      <section className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-10 px-4 pb-14 pt-10 md:px-8 md:pt-14">
          <div className="flex flex-[1_1_340px] flex-col gap-5">
            <span className="text-xs font-semibold tracking-[0.18em] text-gold">SOLDES DE FIN D&apos;ANNÉE</span>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl md:leading-[1.05]">
              Les grandes marques à prix cassés.
            </h1>
            <p className="max-w-md text-white/75 md:text-lg">
              Beauté, musculation, high-tech, café… nos meilleures offres de la saison, vérifiées avant l&apos;envoi et
              livrées chez vous.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#offres"
                className="flex h-13 items-center gap-2 rounded-lg bg-gold px-6 font-semibold text-ink"
              >
                Voir les offres
                <ArrowRightIcon className="size-5" />
              </Link>
              {SHOP_WHATSAPP && (
                <a
                  href={whatsappLink(SHOP_WHATSAPP, "Bonjour Black House, j'aimerais commander.")}
                  className="flex h-13 items-center gap-2 rounded-lg border border-white px-6 font-semibold"
                >
                  <WhatsAppIcon className="size-5" />
                  Commander sur WhatsApp
                </a>
              )}
            </div>
            <span className="text-sm text-white/60">Sans création de compte · Rien à payer en ligne</span>
          </div>
          {/* Visuel de campagne : à remplacer par une photo de Babacar. */}
          <div className="flex aspect-[4/3] flex-[1_1_340px] items-center justify-center rounded-2xl bg-white/10 text-sm text-white/60">
            Visuel de campagne
          </div>
        </div>
      </section>

      <section aria-label="Nos engagements" className="bg-sand">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4 md:px-8">
          {PROMISES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm font-semibold leading-snug">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white">
                <Icon className="size-5" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </section>

      {!getSupabaseEnv() && (
        <p role="alert" className="mx-auto mt-10 max-w-6xl rounded-xl bg-sand p-4">
          Supabase n&apos;est pas configuré : copiez <code>.env.example</code> en <code>.env.local</code> et suivez le
          README.
        </p>
      )}

      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12 md:px-8">
          <h2 className="text-2xl font-semibold md:text-3xl">Catégories</h2>
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/categorie/${category.slug}`}
                  className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl bg-sand p-4 text-white md:aspect-square"
                >
                  {category.image && (
                    <Image
                      src={productImageUrl(category.image)}
                      alt=""
                      fill
                      sizes="(min-width: 1152px) 280px, (min-width: 768px) 25vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  {/* Voile sombre en bas : le titre reste lisible quelle que soit l'image. */}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 bottom-0 h-3/5 ${category.image ? "bg-gradient-to-t from-black/75 to-transparent" : ""}`}
                  />
                  <span className={`relative flex flex-col ${category.image ? "" : "text-ink"}`}>
                    <span className="text-xl font-semibold leading-tight">{category.name}</span>
                    {category.hint && (
                      <span className={`text-sm ${category.image ? "text-white/80" : "text-muted"}`}>{category.hint}</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {offers.length > 0 && (
        <section id="offres" className="mx-auto max-w-6xl scroll-mt-4 px-4 pt-14 md:px-8">
          <h2 className="mb-5 text-2xl font-semibold md:text-3xl">Offres du moment</h2>
          <ProductGrid products={offers} />
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pt-14 md:px-8">
        <div className="rounded-2xl border border-line p-6 md:p-8">
          <h2 className="text-2xl font-semibold md:text-3xl">Comment commander ?</h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink font-bold text-gold">
                  {index + 1}
                </span>
                <span className="flex flex-col">
                  <strong className="font-semibold">{step.title}</strong>
                  <span className="text-muted">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {SHOP_WHATSAPP && (
        <section className="mx-auto max-w-6xl px-4 py-14 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-sand p-6 md:p-8">
            <div className="flex-[1_1_300px]">
              <h2 className="text-xl font-semibold">Une question sur un produit ?</h2>
              <p className="text-muted">Photos, disponibilité, tarifs pour plusieurs pièces : écrivez-nous directement.</p>
            </div>
            <a
              href={whatsappLink(SHOP_WHATSAPP, "Bonjour Black House, j'ai une question sur un produit.")}
              className="flex h-13 items-center gap-2 rounded-lg bg-whatsapp px-6 font-semibold text-white"
            >
              <WhatsAppIcon className="size-5" />
              Écrire sur WhatsApp
            </a>
          </div>
        </section>
      )}
    </main>
  );
}
