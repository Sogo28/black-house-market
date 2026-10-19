import { describe, expect, it } from "vitest";
import { formatSenegalMobile, normalizeSenegalMobile, whatsappLink } from "./phone";

describe("normalizeSenegalMobile", () => {
  it("accepte les formats courants", () => {
    expect(normalizeSenegalMobile("77 123 45 67")).toBe("771234567");
    expect(normalizeSenegalMobile("+221 77 123 45 67")).toBe("771234567");
    expect(normalizeSenegalMobile("00221771234567")).toBe("771234567");
    expect(normalizeSenegalMobile("221771234567")).toBe("771234567");
    expect(normalizeSenegalMobile("78.123.45.67")).toBe("781234567");
  });

  it("refuse ce qui n'est pas un mobile sénégalais", () => {
    expect(normalizeSenegalMobile("33 821 00 00")).toBeNull();
    expect(normalizeSenegalMobile("77 123 45")).toBeNull();
    expect(normalizeSenegalMobile("+33 6 12 34 56 78")).toBeNull();
    expect(normalizeSenegalMobile("")).toBeNull();
  });
});

describe("formatSenegalMobile", () => {
  it("regroupe les chiffres comme on les dicte", () => {
    expect(formatSenegalMobile("771234567")).toBe("77 123 45 67");
  });
});

describe("whatsappLink", () => {
  it("ajoute l'indicatif et encode le message", () => {
    expect(whatsappLink("771234567", "Bonjour, c'est prêt ?")).toBe(
      "https://wa.me/221771234567?text=Bonjour%2C%20c'est%20pr%C3%AAt%20%3F",
    );
  });
});
