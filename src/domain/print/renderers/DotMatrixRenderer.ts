import type { PrintTemplateEntity } from '@/domain/print/types';

export interface DotMatrixRenderResult {
  textStream: string;
  totalLines: number;
  charsPerLine: number;
}

/**
 * Renders fixed-pitch monospace layout for Dot Matrix printers (Epson LQ-310, OKI).
 * Ensures zero overflow on 80-column / 132-column continuous paper.
 */
export class DotMatrixRenderer {
  private charsPerLine: number;

  constructor(charsPerLine = 80) {
    this.charsPerLine = charsPerLine;
  }

  // Format line with left and right aligned content
  formatJustifiedLine(leftText: string, rightText: string): string {
    const totalLen = leftText.length + rightText.length;
    if (totalLen >= this.charsPerLine) {
      return `${leftText.slice(0, this.charsPerLine - rightText.length - 1)} ${rightText}`;
    }
    const spaces = ' '.repeat(this.charsPerLine - totalLen);
    return `${leftText}${spaces}${rightText}`;
  }

  // Format centered line
  formatCenteredLine(text: string): string {
    if (text.length >= this.charsPerLine)
      return text.slice(0, this.charsPerLine);
    const leftPad = Math.floor((this.charsPerLine - text.length) / 2);
    return ' '.repeat(leftPad) + text;
  }

  // Pad string to fixed length
  pad(
    str: string,
    length: number,
    align: 'left' | 'center' | 'right' = 'left',
  ): string {
    if (str.length >= length) return str.slice(0, length);
    const diff = length - str.length;
    if (align === 'left') return str + ' '.repeat(diff);
    if (align === 'right') return ' '.repeat(diff) + str;
    const lPad = Math.floor(diff / 2);
    return ' '.repeat(lPad) + str + ' '.repeat(diff - lPad);
  }

  // Draw separator row
  separator(char = '-'): string {
    return char.repeat(this.charsPerLine);
  }

  // Render a full shipment template into fixed-pitch monospace stream
  renderShipment(
    _template: PrintTemplateEntity,
    data: {
      shipmentCode: string;
      customerName: string;
      date: string;
      items: Array<{
        rollNumber: string;
        fabricType: string;
        colorName: string;
        quantity: number;
      }>;
    },
  ): DotMatrixRenderResult {
    const lines: string[] = [];

    // Header
    lines.push(this.formatCenteredLine('CONG TY TNHH DET MAY VINH PHAT'));
    lines.push(this.formatCenteredLine('PHIEU XUAT KHO GIAO HANG'));
    lines.push(this.separator('='));
    lines.push(
      this.formatJustifiedLine(
        `So: ${data.shipmentCode}`,
        `Ngay: ${data.date}`,
      ),
    );
    lines.push(`Khach hang: ${data.customerName}`);
    lines.push(this.separator('-'));

    // Table Header
    // STT (4) | Ma Cay (8) | Ten Hang (38) | Mau (16) | So Met (10) = 76 chars
    const tableHeader =
      this.pad('STT', 4, 'center') +
      '|' +
      this.pad('Ma Cay', 8, 'center') +
      '|' +
      this.pad('Ten Hang / Quy Cach', 36, 'left') +
      '|' +
      this.pad('Mau Sac', 14, 'left') +
      '|' +
      this.pad('So Met', 12, 'right');
    lines.push(tableHeader);
    lines.push(this.separator('-'));

    let totalMeters = 0;
    data.items.forEach((item, i) => {
      totalMeters += item.quantity;
      const row =
        this.pad((i + 1).toString(), 4, 'center') +
        '|' +
        this.pad(item.rollNumber, 8, 'center') +
        '|' +
        this.pad(item.fabricType, 36, 'left') +
        '|' +
        this.pad(item.colorName, 14, 'left') +
        '|' +
        this.pad(item.quantity.toFixed(1), 12, 'right');
      lines.push(row);
    });

    lines.push(this.separator('-'));
    lines.push(
      this.formatJustifiedLine(
        `Tong so cay: ${data.items.length} cay`,
        `Tong met: ${totalMeters.toFixed(1)} m`,
      ),
    );
    lines.push(this.separator('='));

    // Signatures
    lines.push('');
    lines.push(
      this.pad('Nguoi Lap', 26, 'center') +
        this.pad('Thu Kho', 26, 'center') +
        this.pad('Khach Hang', 26, 'center'),
    );
    lines.push(
      this.pad('(Ky ten)', 26, 'center') +
        this.pad('(Ky ten)', 26, 'center') +
        this.pad('(Ky ten)', 26, 'center'),
    );
    lines.push('');
    lines.push('');

    return {
      textStream: lines.join('\n'),
      totalLines: lines.length,
      charsPerLine: this.charsPerLine,
    };
  }
}
