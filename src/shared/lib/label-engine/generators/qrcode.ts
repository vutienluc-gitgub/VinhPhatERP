import QRCode from 'qrcode';

/**
 * Generates an SVG string representation of a QR code.
 * This is generic and does not depend on React DOM.
 */
export async function generateQRCodeSvg(
  value: string,
  size = 128,
): Promise<string> {
  try {
    const svgString = await QRCode.toString(value, {
      type: 'svg',
      width: size,
      margin: 0,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return svgString;
  } catch (err) {
    console.error('[QR Generator] Error generating SVG:', err);
    return '';
  }
}
