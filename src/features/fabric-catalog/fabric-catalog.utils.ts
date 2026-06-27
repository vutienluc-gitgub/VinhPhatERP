export function getLowestPrice(
  tiers: Array<{ unit_price: number | string }>,
): number | null {
  let min: number | null = null;
  for (const tier of tiers) {
    const price = Number(tier.unit_price);
    if (price > 0 && (min === null || price < min)) {
      min = price;
    }
  }
  return min;
}
