import { Fabric80x40Model } from '@/features/fabric-catalog/label/model';
import { generateQRCodeSvg } from '@/shared/lib/label-engine/generators/qrcode';

export async function renderFabric80x40Svg(
  data: Fabric80x40Model,
): Promise<string> {
  const qrSvg = await generateQRCodeSvg(data.qrValue, 250);

  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const w = 800;
  const h = 400;

  // Basic word wrapping
  const nameChunks = [];
  const words = (data.name || '').split(' ');
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + word).length > 25) {
      if (currentLine) nameChunks.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  if (currentLine) nameChunks.push(currentLine.trim());

  const nameLine1 = escapeHtml(nameChunks[0] || '');
  let nameLine2 = escapeHtml(nameChunks[1] || '');
  if (nameChunks.length > 2) {
    nameLine2 += '...';
  }

  const qrSvgPlaced = qrSvg.replace('<svg ', '<svg x="15" y="75" ');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <style>
        .code { font: bold 38px Arial, sans-serif; fill: #000000; }
        .name { font: 24px Arial, sans-serif; fill: #333333; }
        .specs { font: 20px Arial, sans-serif; fill: #444444; }
        .footer { font: bold 18px Arial, sans-serif; fill: #666666; }
      </style>
      
      <!-- Background -->
      <rect width="${w}" height="${h}" fill="#ffffff" />
      <rect x="8" y="8" width="${w - 16}" height="${h - 16}" rx="16" fill="none" stroke="#e2e8f0" stroke-width="4" />
      
      <!-- QR Code -->
      ${qrSvgPlaced}
      
      <!-- Text Elements -->
      <text x="295" y="105" class="code">${escapeHtml(data.code)}</text>
      
      <text x="295" y="150" class="name">${nameLine1}</text>
      ${nameLine2 ? `<text x="295" y="182" class="name">${nameLine2}</text>` : ''}
      
      ${data.specs ? `<text x="295" y="${nameLine2 ? 219 : 187}" class="specs">${escapeHtml(data.specs)}</text>` : ''}
      
      <text x="295" y="305" class="footer">${escapeHtml(data.footer)}</text>
    </svg>
  `.trim();
}
