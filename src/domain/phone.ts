// Numéros de mobile sénégalais : 9 chiffres commençant par 7, stockés sans l'indicatif.
// On n'impose pas de préfixe d'opérateur précis (77, 78, 76…) pour ne bloquer personne.

const SENEGAL_CODE = "221";

/** « +221 77 123 45 67 », « 00221771234567 », « 77.123.45.67 » → « 771234567 », sinon null. */
export function normalizeSenegalMobile(input: string): string | null {
  let digits = input.replace(/[\s.\-()]/g, "");
  if (digits.startsWith(`+${SENEGAL_CODE}`)) digits = digits.slice(4);
  else if (digits.startsWith(`00${SENEGAL_CODE}`)) digits = digits.slice(5);
  else if (digits.startsWith(SENEGAL_CODE) && digits.length === 12) digits = digits.slice(3);
  return /^7\d{8}$/.test(digits) ? digits : null;
}

/** « 771234567 » → « 77 123 45 67 » */
export function formatSenegalMobile(digits: string): string {
  return digits.replace(/^(\d{2})(\d{3})(\d{2})(\d{2})$/, "$1 $2 $3 $4");
}

/** Lien qui ouvre WhatsApp sur ce numéro, avec un message déjà rédigé. */
export function whatsappLink(digits: string, message: string): string {
  return `https://wa.me/${SENEGAL_CODE}${digits}?text=${encodeURIComponent(message)}`;
}
