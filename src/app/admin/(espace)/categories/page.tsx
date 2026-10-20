import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PlusIcon } from "@/components/icons";
import { requireAdmin } from "@/infra/auth";
import { listCategories } from "@/infra/adminSettings";
import { productImageUrl } from "@/infra/catalogue";
import { AdminCardGridSkeleton } from "@/components/skeletons";

export default function CategoriesPage() {
  return (
    <Suspense fallback={<AdminCardGridSkeleton label="Chargement des catégories…" withImage />}>
      <Categories />
    </Suspense>
  );
}

async function Categories() {
  // Tout le back-office dépend de la requête (session) : rien à pré-rendre.
  await connection();
  const { supabase } = await requireAdmin();
  const categories = await listCategories(supabase);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Catégories</h1>
        <Link href="/admin/categories/nouveau" className="flex h-11 items-center gap-1.5 rounded-lg bg-gold px-4 font-semibold text-ink">
          <PlusIcon className="size-5" />
          Ajouter
        </Link>
      </div>
      <p className="mt-1 text-muted">Elles forment la barre de navigation et l&apos;accueil du site. Cliquez sur une catégorie pour la modifier.</p>

      {categories.length === 0 && <p className="mt-8 text-center text-muted">Aucune catégorie.</p>}
      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <li key={category.id}>
            <Link href={`/admin/categories/${category.id}`} className="group flex flex-col gap-2">
              <span className="relative block aspect-[4/3] overflow-hidden rounded-2xl bg-sand group-hover:ring-2 group-hover:ring-ink">
                {category.image ? (
                  <Image src={productImageUrl(category.image)} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-sm text-muted">Sans image</span>
                )}
                <span className="absolute left-2 top-2 rounded-md bg-ink px-2 py-1 text-xs font-bold text-white">n° {category.position}</span>
              </span>
              <span className="text-lg font-semibold leading-snug group-hover:underline">{category.name}</span>
              {category.hint && <span className="text-sm text-muted">{category.hint}</span>}
              <span className="text-sm font-semibold">
                {category.productCount} produit{category.productCount > 1 ? "s" : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
