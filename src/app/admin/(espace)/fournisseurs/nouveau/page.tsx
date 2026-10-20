import { connection } from "next/server";
import { Suspense } from "react";
import { requireAdmin } from "@/infra/auth";
import { NewPageShell } from "../../_reglages/NewPageShell";
import { SupplierForm } from "../../_reglages/SupplierForm";
import { AdminFormSkeleton } from "@/components/skeletons";

export default function NewSupplierPage() {
  return (
    <Suspense fallback={<AdminFormSkeleton />}>
      <NewSupplier />
    </Suspense>
  );
}

async function NewSupplier() {
  await connection();
  await requireAdmin();
  return (
    <NewPageShell backHref="/admin/fournisseurs" backLabel="Retour aux fournisseurs" title="Nouveau fournisseur" hint="Visible par vous seulement, jamais par les clients.">
      <SupplierForm />
    </NewPageShell>
  );
}
