import { connection } from "next/server";
import { Suspense } from "react";
import { listCategories } from "@/infra/adminSettings";
import { requireAdmin } from "@/infra/auth";
import { CategoryForm } from "../../_reglages/CategoryForm";
import { NewPageShell } from "../../_reglages/NewPageShell";
import { AdminFormSkeleton } from "@/components/skeletons";

export default function NewCategoryPage() {
  return (
    <Suspense fallback={<AdminFormSkeleton />}>
      <NewCategory />
    </Suspense>
  );
}

async function NewCategory() {
  await connection();
  const { supabase } = await requireAdmin();
  const categories = await listCategories(supabase);
  const nextPosition = categories.reduce((max, c) => Math.max(max, c.position), 0) + 1;

  return (
    <NewPageShell backHref="/admin/categories" backLabel="Retour aux catégories" title="Nouvelle catégorie" hint="Vous ajouterez l'image juste après avoir créé la catégorie.">
      <CategoryForm nextPosition={nextPosition} />
    </NewPageShell>
  );
}
