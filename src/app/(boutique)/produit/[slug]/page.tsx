import Link from "next/link";
import { Suspense } from "react";
import { CashIcon, ChevronRightIcon, ReturnIcon, TruckIcon } from "@/components/icons";
import { OrderBox } from "@/components/OrderBox";
import { AvailabilityBox, DiscountBadge, PriceTag, ProductGrid, ProductImage } from "@/components/product";
import { sortProducts } from "@/domain/catalogue";
import { formatFcfa } from "@/domain/money";
import { getCatalogue, getProduct } from "@/infra/catalogue";
import { SHOP_WHATSAPP } from "@/site";
import { requestRestockAlert } from "./actions";
import { ProductPageSkeleton } from "@/components/skeletons";

const RELATED_COUNT = 4;

export default function ProductPage(props: PageProps<"/produit/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-8">
      <Suspense fallback={<ProductPageSkeleton />}>
        <ProductContent {...props} />
      </Suspense>
    </main>
  );
}

async function ProductContent({ params }: PageProps<"/produit/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return (
      <div className="py-10">
        <h1 className="text-2xl font-semibold">Produit introuvable</h1>
        <Link href="/" className="mt-3 inline-block underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const related = sortProducts(
    (await getCatalogue()).filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id),
    "remise",
  ).slice(0, RELATED_COUNT);
  const saving = product.oldPrice !== null ? product.oldPrice - product.price : 0;

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>
        <ChevronRightIcon className="size-4" />
        <Link href={`/categorie/${product.categorySlug}`} className="hover:underline">
          {product.categoryName}
        </Link>
        <ChevronRightIcon className="size-4" />
        <span aria-current="page" className="text-ink">
          {product.name}
        </span>
      </nav>

      <div className="mt-4 flex flex-wrap items-start gap-8 md:gap-10">
        <div className="flex flex-[1.3_1_340px] flex-col gap-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-sand">
            <ProductImage product={product} sizes="(min-width: 1024px) 620px, (min-width: 768px) 55vw, 100vw" />
            <DiscountBadge price={product.price} oldPrice={product.oldPrice} />
          </div>
          {product.images.length > 1 && (
            <ul className="grid grid-cols-4 gap-3">
              {product.images.map((path, index) => (
                <li key={path} className="relative aspect-square overflow-hidden rounded-xl bg-sand">
                  <ProductImage product={product} index={index} sizes="150px" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-[1_1_300px] flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {product.categoryName}
            {product.brand && ` · ${product.brand}`}
          </p>
          <h1 className="text-3xl font-semibold leading-tight">{product.name}</h1>
          <PriceTag price={product.price} oldPrice={product.oldPrice} size="lg" />
          {saving > 0 && (
            <span className="self-start rounded-md bg-sand px-3 py-1.5 text-sm font-semibold">
              Vous économisez {formatFcfa(saving)}
            </span>
          )}
          <AvailabilityBox status={product.status} />
          <OrderBox
            slug={product.slug}
            productName={product.name}
            price={product.price}
            status={product.status}
            shopWhatsapp={SHOP_WHATSAPP}
            restockAction={requestRestockAlert.bind(null, product.slug)}
          />
          <ul className="divide-y divide-line border-y border-line">
            <li className="flex gap-3 py-3">
              <TruckIcon className="size-6 shrink-0" />
              <span className="flex flex-col">
                <strong className="font-semibold">Livraison à domicile</strong>
                <span className="text-sm text-muted">Frais selon votre quartier, payés directement au livreur.</span>
              </span>
            </li>
            <li className="flex gap-3 py-3">
              <CashIcon className="size-6 shrink-0" />
              <span className="flex flex-col">
                <strong className="font-semibold">Paiement à la réception</strong>
                <span className="text-sm text-muted">Espèces, Wave ou Orange Money. Rien à payer en ligne.</span>
              </span>
            </li>
            <li className="flex gap-3 py-3">
              <ReturnIcon className="size-6 shrink-0" />
              <span className="flex flex-col">
                <strong className="font-semibold">Échange</strong>
                <span className="text-sm text-muted">
                  Article abîmé ou différent ? Écrivez-nous sous 24 h.{" "}
                  <Link href="/echanges" className="underline">
                    Voir les conditions
                  </Link>
                </span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      {product.description && (
        <section className="mt-12 max-w-2xl">
          <h2 className="text-2xl font-semibold">Description</h2>
          <p className="mt-2 whitespace-pre-line text-ink/85">{product.description}</p>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-2xl font-semibold">Vous aimerez aussi</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
