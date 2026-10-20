"use client";

import { useRouter } from "next/navigation";

type SupplierSelectProps = {
  suppliers: { id: string; name: string }[];
  selected: string | null;
  /** Adresses prêtes à suivre : une par fournisseur, et une pour « tous » (clé ""). */
  hrefs: Record<string, string>;
};

/** Filtre par fournisseur : un select qui change de page dès qu'on choisit (le filtre de statut est conservé dans les adresses). */
export function SupplierSelect({ suppliers, selected, hrefs }: SupplierSelectProps) {
  const router = useRouter();
  return (
    <div className="mt-2 flex items-center gap-3">
      <label htmlFor="supplier-filter" className="text-sm font-semibold">
        Fournisseur
      </label>
      <div className="relative min-w-0 flex-1 sm:max-w-xs sm:flex-none sm:basis-72">
        <select
          id="supplier-filter"
          value={selected ?? ""}
          onChange={(event) => router.push(hrefs[event.target.value])}
          className={`h-11 w-full appearance-none rounded-full border px-4 pr-11 text-sm font-semibold ${
            selected ? "border-gold bg-gold text-ink" : "border-line bg-white"
          }`}
        >
          <option value="">Tous les fournisseurs</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}
