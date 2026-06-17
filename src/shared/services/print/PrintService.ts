import { PrintAdapter, PrintOptions } from './adapters/PrintAdapter';
import { BrowserPrintAdapter } from './adapters/BrowserPrintAdapter';

export class PrintService {
  private adapter: PrintAdapter;

  constructor(adapter: PrintAdapter) {
    this.adapter = adapter;
  }

  // Allow switching adapter dynamically (e.g. if we detect Electron later)
  setAdapter(adapter: PrintAdapter) {
    this.adapter = adapter;
  }

  async printK80(options?: Omit<PrintOptions, 'paperSize'>) {
    await this.adapter.print({ ...options, paperSize: 'K80' });
  }

  async printA5(options?: Omit<PrintOptions, 'paperSize'>) {
    await this.adapter.print({ ...options, paperSize: 'A5' });
  }

  async printA4(options?: Omit<PrintOptions, 'paperSize'>) {
    await this.adapter.print({ ...options, paperSize: 'A4' });
  }
}

// Export a singleton instance using the default browser adapter
export const printService = new PrintService(new BrowserPrintAdapter());
