import { Suspense } from "react";
import { ProductGrid } from "@/components/product";
import { matchesSearch, sortProducts } from "@/domain/catalogue";
import { getCatalogue } from "@/infra/catalogue";
import { ListingPageSkeleton } from "@/components/skeletons";

export default function SearchPage(props: PageProps<"/recherche">) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-8">
      <Suspense fallback={<ListingPageSkeleton />}>
        <SearchResults {...props} />
      </Suspense>
    </main>
  );
}

async function SearchResults({ searchParams }: PageProps<"/recherche">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const results = query ? sortProducts((await getCatalogue()).filter((p) => matchesSearch(p, query)), null) : [];

  return (
    <>
      <h1 className="text-3xl font-semibold">{query ? `Résultats pour « ${query} »` : "Recherche"}</h1>
      <p className="mb-6 mt-1 text-muted">
        {query
          ? `${results.length} article${results.length > 1 ? "s" : ""} trouvé${results.length > 1 ? "s" : ""}`
          : "Tapez le nom d'un produit ou d'une marque."}
      </p>
      {results.length > 0 && <ProductGrid products={results} />}
    </>
  );
}
