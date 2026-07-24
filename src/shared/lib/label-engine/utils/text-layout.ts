let cachedContext: CanvasRenderingContext2D | null = null;

/**
 * Get a cached canvas 2D context for measuring text.
 * Requires DOM environment.
 */
function getCanvasContext(): CanvasRenderingContext2D {
  if (cachedContext) return cachedContext;

  if (typeof document === 'undefined') {
    throw new Error(
      'Canvas rendering context is not available in non-DOM environments.',
    );
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create canvas 2D context');

  cachedContext = ctx;
  return cachedContext;
}

/**
 * Measure the width of a text string given a CSS font string.
 * @param text The text to measure.
 * @param font The CSS font string (e.g. '24px Arial').
 */
export function measureTextWidth(text: string, font: string): number {
  const ctx = getCanvasContext();
  ctx.font = font;
  return ctx.measureText(text).width;
}

/**
 * Wrap a text string into multiple lines based on a maximum pixel width.
 * @param text The text to wrap.
 * @param maxWidth The maximum width in pixels.
 * @param font The CSS font string (e.g. '24px Arial').
 * @param maxLines Optional limit on the number of lines to return. If text exceeds maxLines, the last line gets an ellipsis.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  font: string,
  maxLines?: number,
): string[] {
  if (!text) return [];

  const ctx = getCanvasContext();
  ctx.font = font;

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;

      if (maxLines && lines.length === maxLines) {
        break; // Stop processing further if we hit max lines early (this will be handled by ellipsis below)
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && (!maxLines || lines.length < maxLines)) {
    lines.push(currentLine);
  }

  // Handle truncation if it exceeds maxLines
  if (maxLines && lines.length >= maxLines) {
    const finalLines = lines.slice(0, maxLines);

    // Check if we need to append ellipsis to the last line
    const processedTextLength = finalLines.join(' ').length;
    if (processedTextLength < text.length) {
      let lastLine = finalLines[maxLines - 1] || '';
      // Make room for ellipsis
      while (
        lastLine.length > 0 &&
        ctx.measureText(lastLine + '...').width > maxWidth
      ) {
        lastLine = lastLine.slice(0, -1);
      }
      finalLines[maxLines - 1] = lastLine + '...';
    }

    return finalLines;
  }

  return lines;
}
