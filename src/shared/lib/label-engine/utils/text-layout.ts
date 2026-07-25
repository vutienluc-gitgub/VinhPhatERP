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

export type TextMeasurement = {
  width: number;
  height: number;
  ascent: number;
  descent: number;
  lineHeight: number;
};

/**
 * Measure text using real font metrics.
 */
export function measureText(text: string, font: string): TextMeasurement {
  const ctx = getCanvasContext();
  ctx.font = font;
  const metrics = ctx.measureText(text);

  // Use actual bounding box or fallback to font size estimation
  const fontSizeMatch = font.match(/(\d+)px/);
  const fontSize = fontSizeMatch?.[1] ? parseInt(fontSizeMatch[1], 10) : 16;

  // 'M' provides a good baseline for ascent if actual metrics are missing
  const mMetrics = ctx.measureText('M');
  const ascent =
    metrics.actualBoundingBoxAscent ||
    metrics.fontBoundingBoxAscent ||
    mMetrics.actualBoundingBoxAscent ||
    fontSize * 0.8;

  const descent =
    metrics.actualBoundingBoxDescent ||
    metrics.fontBoundingBoxDescent ||
    fontSize * 0.2;

  const height = ascent + descent;
  const lineHeight = height * 1.2;

  return {
    width: metrics.width,
    height,
    ascent,
    descent,
    lineHeight,
  };
}

/**
 * Wrap a text string into multiple lines based on a maximum pixel width.
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
        break;
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
    const processedTextLength = finalLines.join(' ').length;

    if (processedTextLength < text.length) {
      let lastLine = finalLines[maxLines - 1] || '';
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
