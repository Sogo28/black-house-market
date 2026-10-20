import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

/** Habillage commun des pages « Nouvelle catégorie / Nouveau fournisseur » (même style que « Nouveau produit »). */
export function NewPageShell({ backHref, backLabel, title, hint, children }: { backHref: string; backLabel: string; title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href={backHref} aria-label={backLabel} className="-ml-2 flex size-11 items-center justify-center">
          <ChevronLeftIcon />
        </Link>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
      <p className="text-sm text-muted">{hint}</p>
      {children}
    </div>
  );
}
