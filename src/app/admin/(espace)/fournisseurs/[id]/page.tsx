import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronLeftIcon } from "@/components/icons";
import { formatFcfa } from "@/domain/money";
import { requireAdmin } from "@/infra/auth";
import { listAdminProducts } from "@/infra/adminProducts";
import { listSuppliers } from "@/infra/adminSettings";
import { productImageUrl } from "@/infra/catalogue";
import { SupplierForm } from "../../_reglages/SupplierForm";
import { SupplierActions } from "../SupplierActions";
import { AdminFormSkeleton } from "@/components/skeletons";

export default function SupplierPage(props: PageProps<"/admin/fournisseurs/[id]">) {
  return (
    <Suspense fallback={<AdminFormSkeleton twoColumns />}>
      <Supplier {...props} />
    </Suspense>
  );
}

async function Supplier({ params }: PageProps<"/admin/fournisseurs/[id]">) {
  await connection();
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const [suppliers, products] = await Promise.all([listSuppliers(supabase), listAdminProducts(supabase)]);
  const supplier = suppliers.find((s) => s.id === id);

  if (!supplier) {
    return (
      <>
        <h1 className="text-2xl font-semibold">Fournisseur introuvable</h1>
        <Link href="/admin/fournisseurs" className="mt-3 inline-block underline">
          Retour aux fournisseurs
        </Link>
      </>
    );
  }
  const items = products.filter((p) => p.supplierId === id);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link href="/admin/fournisseurs" aria-label="Retour aux fournisseurs" className="-ml-2 flex size-11 items-center justify-center">
          <ChevronLeftIcon />
        </Link>
        <h1 className="flex-1 text-2xl font-semibold leading-tight">{supplier.name}</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="flex flex-col gap-5">
          <SupplierForm supplier={supplier} />
          {items.length > 0 && <SupplierActions supplier={supplier} items={items} />}
        </div>

        <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
          <h2 className="text-lg font-semibold">
            Produits ({items.length})
          </h2>
          {items.length === 0 && <p className="text-sm text-muted">Aucun produit rattaché à ce fournisseur.</p>}
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/produits/${p.id}`} className="group flex flex-col gap-1.5 text-sm">
                  <span className="relative block aspect-square overflow-hidden rounded-xl bg-sand group-hover:ring-2 group-hover:ring-ink">
                    {p.mainImage && <Image src={productImageUrl(p.mainImage)} alt="" fill sizes="(min-width: 640px) 160px, 45vw" className="object-cover" />}
                  </span>
                  <span className="font-medium leading-snug group-hover:underline">{p.name}</span>
                  <span className="font-semibold">{formatFcfa(p.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
