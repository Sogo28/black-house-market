// Tri et recherche dans le catalogue. Le catalogue est petit : on filtre en mémoire.

import type { ProductStatus } from "./availability";
import { discountPercent } from "./money";

export type SortKey = "remise" | "prix-croissant" | "prix-decroissant";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "remise", label: "Plus grosses remises" },
  { key: "prix-croissant", label: "Prix croissant" },
  { key: "prix-decroissant", label: "Prix décroissant" },
];

export function parseSort(value: string | string[] | undefined): SortKey | null {
  return SORT_OPTIONS.find((option) => option.key === value)?.key ?? null;
}

type Sortable = { price: number; oldPrice: number | null; status: ProductStatus };

/** Trie sans modifier la liste. Les produits épuisés passent toujours en dernier. */
export function sortProducts<T extends Sortable>(products: T[], sort: SortKey | null): T[] {
  const byChoice = (a: T, b: T): number => {
    switch (sort) {
      case "remise":
        return (discountPercent(b.price, b.oldPrice) ?? 0) - (discountPercent(a.price, a.oldPrice) ?? 0);
      case "prix-croissant":
        return a.price - b.price;
      case "prix-decroissant":
        return b.price - a.price;
      default:
        return 0;
    }
  };
  const soldOutLast = (a: T, b: T) => Number(a.status === "sold_out") - Number(b.status === "sold_out");
  return [...products].sort((a, b) => soldOutLast(a, b) || byChoice(a, b));
}

/** Minuscules, sans accents : « Écran » et « ecran » se valent. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

type Searchable = { name: string; categoryName: string; brand: string | null };

/** Vrai si chaque mot de la recherche apparaît dans le nom, la catégorie ou la marque. */
export function matchesSearch(product: Searchable, query: string): boolean {
  const haystack = normalizeText([product.name, product.categoryName, product.brand ?? ""].join(" "));
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((word) => haystack.includes(word));
}
