import { describe, expect, it } from "vitest";
import { matchesSearch, parseSort, sortProducts } from "./catalogue";

const products = [
  { id: "a", price: 9900, oldPrice: 16500, status: "available" as const }, // -40 %
  { id: "b", price: 8000, oldPrice: 13500, status: "sold_out" as const }, // -41 %, épuisé
  { id: "c", price: 32000, oldPrice: 48000, status: "on_order" as const }, // -33 %
  { id: "d", price: 5500, oldPrice: null, status: "available" as const },
];
const ids = (list: { id: string }[]) => list.map((p) => p.id);

describe("sortProducts", () => {
  it("met les épuisés en dernier, même sans tri choisi", () => {
    expect(ids(sortProducts(products, null))).toEqual(["a", "c", "d", "b"]);
  });

  it("trie par remise", () => {
    expect(ids(sortProducts(products, "remise"))).toEqual(["a", "c", "d", "b"]);
  });

  it("trie par prix", () => {
    expect(ids(sortProducts(products, "prix-croissant"))).toEqual(["d", "a", "c", "b"]);
    expect(ids(sortProducts(products, "prix-decroissant"))).toEqual(["c", "a", "d", "b"]);
  });

  it("ne modifie pas la liste reçue", () => {
    sortProducts(products, "prix-croissant");
    expect(ids(products)).toEqual(["a", "b", "c", "d"]);
  });
});

describe("parseSort", () => {
  it("n'accepte que les tris connus", () => {
    expect(parseSort("remise")).toBe("remise");
    expect(parseSort("n'importe quoi")).toBeNull();
    expect(parseSort(undefined)).toBeNull();
  });
});

describe("matchesSearch", () => {
  const serum = { name: "Sérum éclat vitamine C – 30 ml", categoryName: "Beauté", brand: null };

  it("ignore les accents et la casse", () => {
    expect(matchesSearch(serum, "SERUM")).toBe(true);
    expect(matchesSearch(serum, "beaute vitamine")).toBe(true);
  });

  it("exige tous les mots", () => {
    expect(matchesSearch(serum, "sérum café")).toBe(false);
  });

  it("ne trouve rien pour une recherche vide", () => {
    expect(matchesSearch(serum, "   ")).toBe(false);
  });
});
