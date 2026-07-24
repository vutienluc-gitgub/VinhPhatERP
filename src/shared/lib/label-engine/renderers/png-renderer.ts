/**
 * Converts an SVG string to a PNG data URL.
 * Uses an offscreen image and canvas.
 * Does not depend on React or DOM tree mounting.
 */
export async function exportSvgToPng(
  svgString: string,
  widthPx: number,
  heightPx: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8',
    });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = widthPx;
      canvas.height = heightPx;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Failed to get canvas context'));
      }

      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, widthPx, heightPx);

      // Draw SVG Image
      ctx.drawImage(img, 0, 0, widthPx, heightPx);

      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}
