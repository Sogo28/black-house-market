import { describe, expect, it } from "vitest";
import { backInStockMessage, productOrderMessage } from "./messages";

describe("productOrderMessage", () => {
  it("donne le produit, la quantité et le total", () => {
    expect(productOrderMessage("Sérum vitamine C", 2, 9900)).toBe(
      "Bonjour Black House, je souhaite commander : Sérum vitamine C × 2 (19 800 FCFA). Est-ce disponible ?",
    );
  });
});

describe("backInStockMessage", () => {
  it("cite le produit", () => {
    expect(backInStockMessage("Palette 12 teintes")).toContain("« Palette 12 teintes »");
  });
});
