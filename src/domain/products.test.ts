import { describe, expect, it } from "vitest";
import {
  backInStockNotice,
  checkedLabel,
  imagePath,
  makeMainImage,
  needsRecheck,
  parsePrice,
  slugify,
  supplierListMessage,
  validateProduct,
} from "./products";

describe("slugify", () => {
  it("retire accents, ponctuation et espaces", () => {
    expect(slugify("Sérum éclat vitamine C – 30 ml")).toBe("serum-eclat-vitamine-c-30-ml");
  });
  it("garde une valeur même pour un nom sans lettres", () => {
    expect(slugify("§§§")).toBe("produit");
  });
});

describe("parsePrice", () => {
  it("lit les saisies courantes", () => {
    expect(parsePrice("9900")).toBe(9900);
    expect(parsePrice("9 900")).toBe(9900);
    expect(parsePrice("9 900 FCFA")).toBe(9900);
  });
  it("refuse le reste", () => {
    expect(parsePrice("9,5")).toBeNull();
    expect(parsePrice("-3")).toBeNull();
    expect(parsePrice("")).toBeNull();
  });
});

const valid = {
  name: "  Sérum  éclat ",
  brand: "",
  description: "",
  categoryId: "cat-1",
  supplierId: "",
  price: "9 900",
  oldPrice: "16500",
  status: "available",
  published: true,
};

describe("validateProduct", () => {
  it("nettoie une saisie correcte", () => {
    expect(validateProduct(valid)).toEqual({
      ok: true,
      product: {
        name: "Sérum éclat",
        brand: null,
        description: null,
        categoryId: "cat-1",
        supplierId: null,
        price: 9900,
        oldPrice: 16500,
        status: "available",
        published: true,
      },
    });
  });

  it("refuse un ancien prix qui n'est pas plus élevé", () => {
    const result = validateProduct({ ...valid, oldPrice: "9900" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.oldPrice).toBeDefined();
  });

  it("signale chaque champ invalide", () => {
    const result = validateProduct({ ...valid, name: "", categoryId: "", price: "x", status: "?" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["category", "name", "price", "status"]);
  });
});

describe("stock", () => {
  const now = new Date("2026-10-19T12:00:00Z");
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

  it("marque à revérifier seulement un produit disponible périmé", () => {
    expect(needsRecheck("available", daysAgo(5), now)).toBe(true);
    expect(needsRecheck("available", daysAgo(1), now)).toBe(false);
    expect(needsRecheck("sold_out", daysAgo(9), now)).toBe(false);
    expect(needsRecheck("available", null, now)).toBe(true);
  });

  it("décrit l'ancienneté de la vérification", () => {
    expect(checkedLabel(daysAgo(0.2), now)).toBe("Vérifié aujourd'hui");
    expect(checkedLabel(daysAgo(5), now)).toBe("Vérifié il y a 5 j");
    expect(checkedLabel(null, now)).toBe("Jamais vérifié");
  });
});

describe("messages et photos", () => {
  it("liste les produits au fournisseur", () => {
    expect(supplierListMessage([{ name: "Sérum" }, { name: "Crème" }])).toBe(
      "Bonjour, pouvez-vous me confirmer la disponibilité de :\n• Sérum\n• Crème\nMerci !",
    );
  });

  it("prévient le client du retour du produit", () => {
    expect(backInStockNotice("Palette", 8000, "https://x.sn/produit/palette")).toContain("8 000 FCFA");
  });

  it("range les photos par produit", () => {
    expect(imagePath("p1", "abc", "image/webp")).toBe("p1/abc.webp");
    expect(imagePath("p1", "abc", "image/jpeg")).toBe("p1/abc.jpg");
  });

  it("met la photo choisie en premier", () => {
    expect(makeMainImage(["a", "b", "c"], "c")).toEqual(["c", "a", "b"]);
    expect(makeMainImage(["a", "b"], "z")).toEqual(["a", "b"]);
  });
});
