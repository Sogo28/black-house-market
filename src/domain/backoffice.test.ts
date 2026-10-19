import { describe, expect, it } from "vitest";
import { ageLabel, confirmationMessage, deadline, nextAction, parseAdminTab, supplierQuestion } from "./backoffice";
import type { TrackedItem } from "./tracking";

const item = (overrides: Partial<TrackedItem>): TrackedItem => ({
  name: "Sérum",
  unitPrice: 9900,
  quantity: 2,
  check: "available",
  choice: null,
  replacement: null,
  ...overrides,
});

describe("deadline", () => {
  const now = new Date("2026-10-19T10:00:00Z");
  it("donne le temps restant", () => {
    expect(deadline(new Date("2026-10-19T11:48:00Z"), now)).toEqual({ label: "Reste 1 h 48", late: false });
    expect(deadline(new Date("2026-10-19T10:05:00Z"), now)).toEqual({ label: "Reste 5 min", late: false });
  });
  it("signale le retard", () => {
    expect(deadline(new Date("2026-10-19T09:50:00Z"), now)).toEqual({ label: "En retard de 10 min", late: true });
  });
});

describe("nextAction", () => {
  it("attend que tout soit vérifié", () => {
    expect(nextAction("checking", [item({}), item({ check: "pending" })])).toEqual({ kind: "verify", remaining: 1 });
  });
  it("demande le choix du client si un article manque", () => {
    expect(nextAction("checking", [item({}), item({ check: "unavailable" })])).toEqual({ kind: "ask-choice" });
  });
  it("propose de confirmer quand tout est disponible ou choisi", () => {
    expect(nextAction("received", [item({})])).toEqual({ kind: "confirm" });
    expect(nextAction("checking", [item({ check: "unavailable", choice: "remove" }), item({})])).toEqual({
      kind: "confirm",
    });
  });
  it("enchaîne livraison puis clôture", () => {
    expect(nextAction("confirmed", [])).toEqual({ kind: "ship" });
    expect(nextAction("shipping", [])).toEqual({ kind: "deliver" });
    expect(nextAction("delivered", [])).toEqual({ kind: "none" });
  });
});

describe("messages", () => {
  it("détaille la commande confirmée, remplacements compris", () => {
    const message = confirmationMessage({
      firstName: "Awa",
      code: "BH-1042",
      deliveryFee: 2000,
      items: [
        item({}),
        item({ name: "Whey isolat", unitPrice: 32000, quantity: 1, check: "unavailable", choice: "replace", replacement: { name: "Whey", price: 30000 } }),
        item({ name: "Café", check: "unavailable", choice: "remove" }),
      ],
    });
    expect(message).toContain("• Sérum × 2");
    expect(message).toContain("• Whey × 1");
    expect(message).not.toContain("Café");
    expect(message).toContain("soit 51 800 FCFA à payer");
  });

  it("pose la question au fournisseur", () => {
    expect(supplierQuestion("Sérum", 2)).toBe("Bonjour, avez-vous toujours « Sérum » en 2 exemplaires ? Merci !");
  });
});

describe("parseAdminTab", () => {
  it("revient à « À traiter » par défaut", () => {
    expect(parseAdminTab("en-livraison")).toBe("en-livraison");
    expect(parseAdminTab("inconnu")).toBe("a-traiter");
  });
});

describe("ageLabel", () => {
  const now = new Date("2026-10-19T12:00:00Z");
  const ago = (minutes: number) => new Date(now.getTime() - minutes * 60000);
  it("choisit l'unité la plus parlante", () => {
    expect(ageLabel(ago(0), now)).toBe("à l'instant");
    expect(ageLabel(ago(12), now)).toBe("il y a 12 min");
    expect(ageLabel(ago(190), now)).toBe("il y a 3 h");
    expect(ageLabel(ago(60 * 24 * 2 + 30), now)).toBe("il y a 2 j");
  });
});
