export function parseNumericString(
  input: string | number | null | undefined,
): number | null {
  if (input === null || input === undefined || input === '') {
    return null;
  }

  if (typeof input === 'number') {
    return Number.isNaN(input) ? null : input;
  }

  // Lowercase and remove extra spaces
  const str = input.toLowerCase().trim().replace(/\s+/g, '');

  if (str === '') return null;

  // Extract the numeric part and the suffix part
  // Matches optional minus, digits, dots, commas ending with digit
  const match = str.match(/^(-?[0-9.,]*[0-9])(.*)$/);
  if (!match) return null; // Invalid format

  let rawNumber = match[1] || '';
  const suffix = match[2] || '';

  let multiplier = 1;
  if (suffix === 'k') {
    multiplier = 1000;
  } else if (
    suffix === 'm' ||
    suffix === 'tr' ||
    suffix === 'triệu' ||
    suffix === 'trieu'
  ) {
    multiplier = 1_000_000;
  } else if (suffix === 'tỷ' || suffix === 'ty' || suffix === 'b') {
    multiplier = 1_000_000_000;
  }

  // If there's a multiplier, users might type "1.5m" or "1,5m"
  // In both cases, they mean 1.5 million.
  // The heuristic: if there's a multiplier, only single separator is expected, treat it as decimal
  if (multiplier > 1) {
    rawNumber = rawNumber.replace(',', '.');
  } else {
    // Smart separator logic
    const lastDot = rawNumber.lastIndexOf('.');
    const lastComma = rawNumber.lastIndexOf(',');

    if (lastDot > -1 && lastComma > -1) {
      if (lastDot > lastComma) {
        // 1,234.56 -> decimal is .
        rawNumber = rawNumber.replace(/,/g, '');
      } else {
        // 1.234,56 -> decimal is ,
        rawNumber = rawNumber.replace(/\./g, '').replace(',', '.');
      }
    } else if (lastDot > -1) {
      // Only dots
      const parts = rawNumber.split('.');
      const lastPart = parts[parts.length - 1] || '';
      if (parts.length > 2 || lastPart.length === 3) {
        // Multiple dots (1.234.567) or exactly 3 digits (85.000)
        // Assume thousand separator
        rawNumber = rawNumber.replace(/\./g, '');
      } else {
        // 12.5 -> decimal (already a dot, do nothing)
      }
    } else if (lastComma > -1) {
      // Only commas
      const parts = rawNumber.split(',');
      const lastPart = parts[parts.length - 1] || '';
      if (parts.length > 2 || lastPart.length === 3) {
        // Multiple commas (1,234,567) or exactly 3 digits (85,000)
        // Assume thousand separator
        rawNumber = rawNumber.replace(/,/g, '');
      } else {
        // 12,5 -> decimal
        rawNumber = rawNumber.replace(',', '.');
      }
    }
  }

  const parsed = parseFloat(rawNumber);
  if (Number.isNaN(parsed)) return null;

  return parsed * multiplier;
}
