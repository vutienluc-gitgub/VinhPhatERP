export function useFabricDisplayLogic() {
  return { displayMode: 'grid', setDisplayMode: () => {} };
}

export function getLowestPriceLabel(variants?: any[]): string {
  if (!variants || variants.length === 0) return 'Liên hệ báo giá';
  const prices = variants.map((v) => Number(v.price || v.unit_price || 0)).filter((p) => p > 0);
  if (prices.length === 0) return 'Liên hệ báo giá';
  const minPrice = Math.min(...prices);
  return `Từ ${minPrice.toLocaleString('vi-VN')} ₫/kg`;
}
