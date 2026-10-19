import { describe, expect, it } from "vitest";
import { canBeOrdered, displayedStatus, isStale } from "./availability";

const now = new Date("2026-10-19T12:00:00Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

describe("isStale", () => {
  it("considère une vérification de plus de 3 jours comme périmée", () => {
    expect(isStale(daysAgo(2), now)).toBe(false);
    expect(isStale(daysAgo(3), now)).toBe(false);
    expect(isStale(daysAgo(3.01), now)).toBe(true);
  });

  it("considère un produit jamais vérifié comme périmé", () => {
    expect(isStale(null, now)).toBe(true);
  });
});

describe("displayedStatus", () => {
  it("affiche « sur commande » un produit disponible mais pas revérifié", () => {
    expect(displayedStatus("available", daysAgo(5), now)).toBe("on_order");
    expect(displayedStatus("available", daysAgo(1), now)).toBe("available");
  });

  it("ne touche pas aux autres statuts", () => {
    expect(displayedStatus("sold_out", daysAgo(10), now)).toBe("sold_out");
    expect(displayedStatus("on_order", daysAgo(0), now)).toBe("on_order");
  });
});

describe("canBeOrdered", () => {
  it("interdit seulement les produits épuisés", () => {
    expect(canBeOrdered("available")).toBe(true);
    expect(canBeOrdered("on_order")).toBe(true);
    expect(canBeOrdered("sold_out")).toBe(false);
  });
});
