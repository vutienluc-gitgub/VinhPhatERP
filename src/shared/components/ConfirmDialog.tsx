import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Button } from './Button';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void | Promise<void>;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = (opts: ConfirmOptions) => {
    setOptions(opts);
  };

  const handleConfirm = async () => {
    if (!options) return;
    try {
      setLoading(true);
      await options.onConfirm();
      setOptions(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{options.title || 'Xác nhận hành động'}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{options.message}</p>
            <div className="flex justify-end gap-3 mt-2">
              <Button variant="outline" onClick={() => setOptions(null)} disabled={loading}>
                {options.cancelText || 'Hủy bỏ'}
              </Button>
              <Button
                variant={options.variant === 'danger' ? 'danger' : 'primary'}
                onClick={handleConfirm}
                loading={loading}
              >
                {options.confirmText || 'Đồng ý'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  return ctx || { confirm: (opts: ConfirmOptions) => opts.onConfirm() };
}
