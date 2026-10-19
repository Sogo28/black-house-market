import { describe, expect, it } from "vitest";
import { choiceTotals, currentStep, linesTotal, missingItems, trackedLine, type TrackedItem } from "./tracking";

const kit: TrackedItem = { name: "Kit", unitPrice: 7000, quantity: 1, check: "available", choice: null, replacement: null };
const whey: TrackedItem = {
  name: "Whey isolat",
  unitPrice: 32000,
  quantity: 1,
  check: "unavailable",
  choice: null,
  replacement: { name: "Whey", price: 30000 },
};

describe("currentStep", () => {
  it("regroupe vérification et choix en attente sous « En préparation »", () => {
    expect(currentStep("checking")).toBe(1);
    expect(currentStep("action_required")).toBe(1);
    expect(currentStep("delivered")).toBe(4);
    expect(currentStep("cancelled")).toBeNull();
  });
});

describe("trackedLine", () => {
  it("ne compte pas un article manquant tant que le client n'a pas choisi", () => {
    expect(trackedLine(whey)).toMatchObject({ state: "unavailable", amount: null });
  });

  it("affiche le remplacement accepté à son prix", () => {
    expect(trackedLine({ ...whey, choice: "replace" })).toEqual({
      name: "Whey",
      quantity: 1,
      amount: 30000,
      state: "replaced",
    });
  });

  it("retire l'article si le client continue sans", () => {
    expect(trackedLine({ ...whey, choice: "remove" })).toMatchObject({ state: "removed", amount: null });
  });

  it("additionne seulement les lignes qui comptent", () => {
    expect(linesTotal([kit, whey].map(trackedLine))).toBe(7000);
  });
});

describe("choix du client", () => {
  it("liste les articles manquants sans choix", () => {
    expect(missingItems([kit, whey])).toEqual([whey]);
    expect(missingItems([kit, { ...whey, choice: "remove" }])).toEqual([]);
  });

  it("calcule le total de chaque option", () => {
    expect(choiceTotals([kit, whey])).toEqual({ withReplacement: 37000, without: 7000 });
    expect(choiceTotals([kit, { ...whey, replacement: null }])).toEqual({ withReplacement: null, without: 7000 });
  });
});
