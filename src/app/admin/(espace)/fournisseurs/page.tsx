import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PlusIcon, WhatsAppIcon } from "@/components/icons";
import { formatSenegalMobile } from "@/domain/phone";
import { requireAdmin } from "@/infra/auth";
import { listSuppliers } from "@/infra/adminSettings";
import { AdminCardGridSkeleton } from "@/components/skeletons";

export default function SuppliersPage() {
  return (
    <Suspense fallback={<AdminCardGridSkeleton label="Chargement des fournisseurs…" withImage={false} />}>
      <Suppliers />
    </Suspense>
  );
}

async function Suppliers() {
  await connection();
  const { supabase } = await requireAdmin();
  const suppliers = await listSuppliers(supabase);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Fournisseurs</h1>
        <Link href="/admin/fournisseurs/nouveau" className="flex h-11 items-center gap-1.5 rounded-lg bg-gold px-4 font-semibold text-ink">
          <PlusIcon className="size-5" />
          Ajouter
        </Link>
      </div>
      <p className="mt-1 text-muted">Visibles par vous seulement, jamais par les clients. Cliquez sur un fournisseur pour le modifier.</p>

      {suppliers.length === 0 && <p className="mt-8 text-center text-muted">Aucun fournisseur.</p>}
      <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
          <li key={supplier.id}>
            <Link
              href={`/admin/fournisseurs/${supplier.id}`}
              className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-white p-4 hover:border-ink"
            >
              <span className="text-lg font-semibold leading-snug">{supplier.name}</span>
              <span className="flex items-center gap-1.5 text-sm text-muted">
                <WhatsAppIcon className="size-4" />
                {supplier.whatsapp ? `+221 ${formatSenegalMobile(supplier.whatsapp)}` : "Pas de numéro"}
              </span>
              {supplier.notes && <span className="text-sm text-muted">{supplier.notes}</span>}
              <span className="mt-auto pt-1 text-sm font-semibold">
                {supplier.productCount} produit{supplier.productCount > 1 ? "s" : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
