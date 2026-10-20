import Link from "next/link";
import { Suspense } from "react";
import { ChevronRightIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product";
import { parseSort, SORT_OPTIONS, sortProducts } from "@/domain/catalogue";
import { getCatalogue, getCategories } from "@/infra/catalogue";
import { ListingPageSkeleton } from "@/components/skeletons";

// Les paramètres se lisent sous <Suspense> : une catégorie ajoutée après le build
// est servie tout de suite avec le squelette, puis mise en cache.
export default function CategoryPage(props: PageProps<"/categorie/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-8">
      <Suspense fallback={<ListingPageSkeleton />}>
        <CategoryContent {...props} />
      </Suspense>
    </main>
  );
}

async function CategoryContent({ params, searchParams }: PageProps<"/categorie/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const sort = parseSort(query.tri);
  const [categories, catalogue] = await Promise.all([getCategories(), getCatalogue()]);

  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    return (
      <div className="py-10">
        <h1 className="text-2xl font-semibold">Catégorie introuvable</h1>
        <Link href="/" className="mt-3 inline-block underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const products = sortProducts(
    catalogue.filter((p) => p.categorySlug === slug),
    sort,
  );

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:underline">
          Accueil
        </Link>
        <ChevronRightIcon className="size-4" />
        <span aria-current="page">{category.name}</span>
      </nav>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold">{category.name}</h1>
        <span className="text-sm text-muted">
          {products.length} article{products.length > 1 ? "s" : ""}
        </span>
      </div>

      <nav aria-label="Trier" className="my-5 flex gap-2 overflow-x-auto pb-1">
        {SORT_OPTIONS.map((option) => {
          const active = option.key === sort;
          return (
            <Link
              key={option.key}
              href={active ? `/categorie/${slug}` : `/categorie/${slug}?tri=${option.key}`}
              aria-current={active ? "true" : undefined}
              className={`flex h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold ${
                active ? "border-ink bg-ink text-white" : "border-line bg-white"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </nav>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <p className="py-10 text-muted">Aucun produit dans cette catégorie pour le moment.</p>
      )}
    </>
  );
}
