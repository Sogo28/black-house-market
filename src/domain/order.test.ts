import { describe, expect, it } from "vitest";
import { parseCartLines, validateOrder } from "./order";

describe("parseCartLines", () => {
  it("fusionne les doublons et plafonne la quantité", () => {
    expect(
      parseCartLines([
        { slug: "serum", quantity: 2 },
        { slug: "serum", quantity: 25 },
        { slug: "whey", quantity: 1 },
      ]),
    ).toEqual([
      { slug: "serum", quantity: 20 },
      { slug: "whey", quantity: 1 },
    ]);
  });

  it("refuse un panier mal formé", () => {
    expect(parseCartLines("nope")).toBeNull();
    expect(parseCartLines([{ slug: "serum", quantity: 0 }])).toBeNull();
    expect(parseCartLines([{ slug: "serum", quantity: 1.5 }])).toBeNull();
    expect(parseCartLines([{ slug: "<script>", quantity: 1 }])).toBeNull();
  });
});

const valid = {
  name: "  Awa   Ndiaye ",
  phone: "+221 77 123 45 67",
  commune: "Médina",
  address: "Rue 10, maison verte",
  payment: "wave",
  cart: JSON.stringify([{ slug: "serum-vitamine-c-30ml", quantity: 2 }]),
};

describe("validateOrder", () => {
  it("nettoie et accepte une commande correcte", () => {
    expect(validateOrder(valid)).toEqual({
      ok: true,
      order: {
        name: "Awa Ndiaye",
        phone: "771234567",
        commune: "Médina",
        address: "Rue 10, maison verte",
        payment: "wave",
        lines: [{ slug: "serum-vitamine-c-30ml", quantity: 2 }],
      },
    });
  });

  it("signale chaque champ invalide", () => {
    const result = validateOrder({ name: "A", phone: "12", commune: "Paris", address: "", payment: "cb", cart: "[]" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(["address", "cart", "commune", "name", "payment", "phone"]);
    }
  });

  it("refuse un panier illisible", () => {
    const result = validateOrder({ ...valid, cart: "{pas du json" });
    expect(result.ok).toBe(false);
  });
});
