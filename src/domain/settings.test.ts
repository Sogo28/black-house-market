import { describe, expect, it } from "vitest";
import { validateCategory, validateSupplier } from "./settings";

describe("validateSupplier", () => {
  it("nettoie le nom et normalise le WhatsApp", () => {
    expect(validateSupplier({ name: "  Fournisseur   1 ", whatsapp: "+221 77 123 45 67", notes: "" })).toEqual({
      ok: true,
      supplier: { name: "Fournisseur 1", whatsapp: "771234567", notes: null },
    });
  });

  it("accepte l'absence de WhatsApp", () => {
    const result = validateSupplier({ name: "Grossiste", whatsapp: "  ", notes: "Appeler avant 17 h" });
    expect(result).toEqual({ ok: true, supplier: { name: "Grossiste", whatsapp: null, notes: "Appeler avant 17 h" } });
  });

  it("refuse un numéro qui n'est pas un mobile sénégalais", () => {
    const result = validateSupplier({ name: "Grossiste", whatsapp: "33 821 00 00", notes: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(["whatsapp"]);
  });

  it("refuse un nom trop court", () => {
    expect(validateSupplier({ name: "A", whatsapp: "", notes: "" }).ok).toBe(false);
  });
});

describe("validateCategory", () => {
  it("accepte une catégorie complète", () => {
    expect(validateCategory({ name: " Beauté ", hint: "Soins, parfums", position: "2" })).toEqual({
      ok: true,
      category: { name: "Beauté", hint: "Soins, parfums", position: 2 },
    });
  });

  it("met l'ordre à 0 s'il est vide et refuse les valeurs absurdes", () => {
    expect(validateCategory({ name: "Café", hint: "", position: "" })).toMatchObject({ ok: true, category: { position: 0 } });
    expect(validateCategory({ name: "Café", hint: "", position: "-1" }).ok).toBe(false);
    expect(validateCategory({ name: "Café", hint: "", position: "1.5" }).ok).toBe(false);
  });
});
