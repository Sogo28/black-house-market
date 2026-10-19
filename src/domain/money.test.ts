import { describe, expect, it } from "vitest";
import { discountPercent, formatFcfa } from "./money";

describe("formatFcfa", () => {
  it("sépare les milliers par une espace fine insécable", () => {
    expect(formatFcfa(9900)).toBe("9 900 FCFA");
    expect(formatFcfa(1250000)).toBe("1 250 000 FCFA");
  });

  it("n'ajoute pas de séparateur sous 1 000", () => {
    expect(formatFcfa(500)).toBe("500 FCFA");
  });
});

describe("discountPercent", () => {
  it("arrondit la remise", () => {
    expect(discountPercent(9900, 16500)).toBe(40);
    expect(discountPercent(32000, 48000)).toBe(33);
  });

  it("ne donne pas de remise sans ancien prix plus élevé", () => {
    expect(discountPercent(9900, null)).toBeNull();
    expect(discountPercent(9900, 9900)).toBeNull();
  });
});
