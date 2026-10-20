import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronLeftIcon } from "@/components/icons";
import { requireAdmin } from "@/infra/auth";
import { listCategories } from "@/infra/adminSettings";
import { productImageUrl } from "@/infra/catalogue";
import { CategoryForm } from "../../_reglages/CategoryForm";
import { AdminFormSkeleton } from "@/components/skeletons";

export default function CategoryPage(props: PageProps<"/admin/categories/[id]">) {
  return (
    <Suspense fallback={<AdminFormSkeleton />}>
      <Category {...props} />
    </Suspense>
  );
}

async function Category({ params }: PageProps<"/admin/categories/[id]">) {
  await connection();
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const category = (await listCategories(supabase)).find((c) => c.id === id);

  if (!category) {
    return (
      <>
        <h1 className="text-2xl font-semibold">Catégorie introuvable</h1>
        <Link href="/admin/categories" className="mt-3 inline-block underline">
          Retour aux catégories
        </Link>
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/categories" aria-label="Retour aux catégories" className="-ml-2 flex size-11 items-center justify-center">
          <ChevronLeftIcon />
        </Link>
        <h1 className="flex-1 text-2xl font-semibold leading-tight">{category.name}</h1>
      </div>
      <Link href={`/categorie/${category.slug}`} className="self-start text-sm underline">
        Voir la page sur le site
      </Link>
      <CategoryForm
        category={{
          id: category.id,
          name: category.name,
          hint: category.hint,
          position: category.position,
          productCount: category.productCount,
          imageUrl: category.image ? productImageUrl(category.image) : null,
        }}
      />
    </div>
  );
}
