import { PrintAdapter, PrintOptions } from './PrintAdapter';

export class BrowserPrintAdapter implements PrintAdapter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  print(_options?: PrintOptions): void {
    // Browser doesn't support silent print or copies via JS natively,
    // it just opens the print dialog.
    window.print();
  }
}
