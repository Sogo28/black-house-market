import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronLeftIcon } from "@/components/icons";
import { requireAdmin } from "@/infra/auth";
import { listCategoryOptions, listSupplierOptions } from "@/infra/adminProducts";
import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <Suspense fallback={<p className="text-muted">Chargement…</p>}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  await connection();
  const { supabase } = await requireAdmin();
  const [categories, suppliers] = await Promise.all([listCategoryOptions(supabase), listSupplierOptions(supabase)]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/produits" aria-label="Retour aux produits" className="-ml-2 flex size-11 items-center justify-center">
          <ChevronLeftIcon />
        </Link>
        <h1 className="text-2xl font-semibold">Nouveau produit</h1>
      </div>
      <p className="text-sm text-muted">Vous ajouterez les photos juste après avoir créé le produit.</p>
      <ProductForm categories={categories} suppliers={suppliers} />
    </div>
  );
}
