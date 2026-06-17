export interface PrintOptions {
  silent?: boolean;
  paperSize?: 'K80' | 'A5' | 'A4';
  copies?: number;
}

export interface PrintAdapter {
  print(options?: PrintOptions): Promise<void> | void;
}
