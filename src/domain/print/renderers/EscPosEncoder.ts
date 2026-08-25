/**
 * ESC/POS Command Encoder for VinhPhatERP Thermal Receipt & Label Printing.
 * Generates raw bytes for ESC/POS compliant thermal printers (Xprinter, Epson, Bixolon).
 */

export class EscPosEncoder {
  private buffer: number[] = [];

  // Initialize printer
  init(): this {
    this.buffer.push(0x1b, 0x40); // ESC @
    return this;
  }

  // Text alignment: 0 = Left, 1 = Center, 2 = Right
  align(alignment: 'left' | 'center' | 'right'): this {
    const code = alignment === 'left' ? 0 : alignment === 'center' ? 1 : 2;
    this.buffer.push(0x1b, 0x61, code); // ESC a n
    return this;
  }

  // Bold text: 1 = On, 0 = Off
  bold(enable: boolean): this {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0); // ESC E n
    return this;
  }

  // Underline
  underline(enable: boolean): this {
    this.buffer.push(0x1b, 0x2d, enable ? 1 : 0); // ESC - n
    return this;
  }

  // Double height & width
  doubleSize(enable: boolean): this {
    this.buffer.push(0x1d, 0x21, enable ? 0x11 : 0x00); // GS ! n
    return this;
  }

  // Append raw text string (ASCII / UTF-8 normalized)
  text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      this.buffer.push(charCode < 128 ? charCode : 0x20); // Fallback non-ascii to space or custom code page
    }
    return this;
  }

  // Line feed
  line(str = ''): this {
    if (str) this.text(str);
    this.buffer.push(0x0a); // LF
    return this;
  }

  // Draw separator line
  separator(width = 32, char = '-'): this {
    return this.line(char.repeat(width));
  }

  // Code128 Barcode generator
  barcodeCode128(data: string, heightDots = 50): this {
    this.buffer.push(0x1d, 0x68, heightDots); // GS h n (height)
    this.buffer.push(0x1d, 0x77, 2); // GS w n (width)
    this.buffer.push(0x1d, 0x48, 2); // GS H n (text below barcode)
    this.buffer.push(0x1d, 0x6b, 73, data.length); // GS k 73 len (Code128)
    for (let i = 0; i < data.length; i++) {
      this.buffer.push(data.charCodeAt(i));
    }
    this.buffer.push(0x0a);
    return this;
  }

  // Cut paper: partial or full
  cut(partial = true): this {
    this.buffer.push(0x1d, 0x56, partial ? 1 : 0); // GS V n
    return this;
  }

  // Get raw Uint8Array for transport (Web USB / Network socket / Bluetooth)
  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
