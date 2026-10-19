// Montants en FCFA : toujours des entiers, sans centimes.

const THIN_SPACE = " "; // séparateur de milliers français (espace fine insécable)
const NO_BREAK_SPACE = " ";

/** 9900 → « 9 900 FCFA », sans retour à la ligne possible au milieu. */
export function formatFcfa(amount: number): string {
  const digits = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, THIN_SPACE);
  return `${digits}${NO_BREAK_SPACE}FCFA`;
}

/** Remise arrondie en pourcentage, ou null s'il n'y a pas d'ancien prix plus élevé. */
export function discountPercent(price: number, oldPrice: number | null): number | null {
  if (oldPrice === null || oldPrice <= price) return null;
  return Math.round((1 - price / oldPrice) * 100);
}
