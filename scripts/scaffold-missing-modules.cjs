const fs = require('fs');
const path = require('path');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFileIfMissing(relPath, content) {
  const fullPath = path.join(process.cwd(), 'src', relPath);
  if (!fs.existsSync(fullPath)) {
    ensureDir(fullPath);
    fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
    console.log('Created:', relPath);
  }
}

console.log('Scaffolding missing modules...');

// ──────────────────────────────────────────────
// 1. Shared Types
// ──────────────────────────────────────────────
writeFileIfMissing('shared/types/database.models.ts', `
export type UserRole = 'admin' | 'manager' | 'staff' | 'driver' | 'customer' | 'supplier' | 'worker' | string;

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  phone?: string;
  tenant_id?: string;
  created_at?: string;
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  settings?: Record<string, any>;
}

export interface BaseModel {
  id: string;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}
`);

writeFileIfMissing('shared/types/feature.ts', `
import type { ERPPlugin } from '@/app/types/plugin';
export type FeaturePlugin = ERPPlugin;
`);

writeFileIfMissing('shared/types/pagination.ts', `
export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
`);

// ──────────────────────────────────────────────
// 2. Shared Utils
// ──────────────────────────────────────────────
writeFileIfMissing('shared/utils/cn.ts', `
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`);

writeFileIfMissing('shared/utils/format.ts', `
export function formatCurrency(amount: number | string | null | undefined, currency: string = 'VND'): string {
  if (amount == null || isNaN(Number(amount))) return '0 ₫';
  const num = Number(amount);
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
}

export function formatNumber(num: number | string | null | undefined): string {
  if (num == null || isNaN(Number(num))) return '0';
  return new Intl.NumberFormat('vi-VN').format(Number(num));
}

export function formatDate(date: string | Date | null | undefined, formatStr: string = 'DD/MM/YYYY'): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return \`\${day}/\${month}/\${year}\`;
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return \`\${hours}:\${mins} \${day}/\${month}/\${year}\`;
}
`);

writeFileIfMissing('shared/utils/error.ts', `
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Đã xảy ra lỗi không xác định';
}
`);

writeFileIfMissing('shared/utils/logger.ts', `
export const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};
`);

writeFileIfMissing('shared/utils/phone.ts', `
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\\d{4})(\\d{3})(\\d{3})/, '$1 $2 $3');
  }
  return phone;
}
`);

writeFileIfMissing('shared/utils/array.util.ts', `
export function groupBy<T, K extends string | number>(array: T[], keyFn: (item: T) => K): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function uniq<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}
`);

writeFileIfMissing('shared/utils/export.ts', `
export async function exportToExcel(data: any[], fileName: string) {
  console.log('Exporting to excel:', fileName, data);
}
export async function exportToCsv(data: any[], fileName: string) {
  console.log('Exporting to csv:', fileName, data);
}
`);

writeFileIfMissing('shared/utils/constants.ts', `
export const APP_NAME = 'Vinh Phat ERP';
export const DEFAULT_PAGE_SIZE = 20;
`);

// ──────────────────────────────────────────────
// 3. Shared Library & FeatureRegistry
// ──────────────────────────────────────────────
writeFileIfMissing('shared/lib/FeatureRegistry.ts', `
import type { ERPPlugin, PluginLifecycleState } from '@/app/types/plugin';

export type FeaturePlugin = ERPPlugin;

class FeatureRegistryClass {
  private plugins = new Map<string, ERPPlugin>();
  private states = new Map<string, PluginLifecycleState>();

  register(plugin: ERPPlugin) {
    this.plugins.set(plugin.key, plugin);
    this.states.set(plugin.key, 'registered');
  }

  registerAll(plugins: ERPPlugin[]) {
    for (const plugin of plugins) {
      this.register(plugin);
    }
  }

  get(key: string): ERPPlugin | undefined {
    return this.plugins.get(key);
  }

  getAll(): ERPPlugin[] {
    return Array.from(this.plugins.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  getByGroup(group: string): ERPPlugin[] {
    return this.getAll().filter((p) => p.group === group);
  }

  getPrintRoutes() {
    const routes: Array<{ path: string; component: () => Promise<{ default: any }> }> = [];
    for (const p of this.plugins.values()) {
      if (p.printRoutes) {
        routes.push(...p.printRoutes);
      }
    }
    return routes;
  }

  async init(): Promise<void> {
    for (const [key, plugin] of this.plugins.entries()) {
      try {
        this.states.set(key, 'initializing');
        if (plugin.onInit) {
          await plugin.onInit();
        }
        this.states.set(key, 'initialized');
      } catch (err) {
        console.error('Failed to init plugin ' + key + ':', err);
        this.states.set(key, 'failed');
      }
    }
  }
}

export const FeatureRegistry = new FeatureRegistryClass();
`);

writeFileIfMissing('shared/lib/rbac/RBACEvaluator.ts', `
import type { UserRole } from '@/shared/types/database.models';

export class RBACEvaluator {
  static hasRole(userRole: UserRole | undefined, requiredRoles?: UserRole[] | string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!userRole) return false;
    return (requiredRoles as string[]).includes(userRole);
  }

  static hasPermission(permissions: string[] | undefined, requiredPermissions?: string[]): boolean {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    if (!permissions) return false;
    return requiredPermissions.some((p) => permissions.includes(p));
  }
}
`);

writeFileIfMissing('shared/lib/label-engine.ts', `
export const LabelEngine = {
  render: (template: string, data: Record<string, any>) => template,
};
`);

writeFileIfMissing('shared/lib/print-template.engine.ts', `
export const PrintTemplateEngine = {
  render: (template: string, data: Record<string, any>) => template,
};
`);

writeFileIfMissing('shared/lib/chat-audio.ts', `
export const playChatSound = () => {};
`);
writeFileIfMissing('shared/lib/chat-broadcast.ts', `
export const broadcastChatMessage = (msg: any) => {};
`);
writeFileIfMissing('shared/lib/chat-cache-storage.ts', `
export const chatCache = new Map();
`);
writeFileIfMissing('shared/lib/chat-offline-queue.ts', `
export const chatOfflineQueue = { add: () => {}, flush: () => {} };
`);
writeFileIfMissing('shared/lib/chat-sound.ts', `
export const playSound = () => {};
`);
writeFileIfMissing('shared/lib/chat-storage.ts', `
export const chatStorage = { get: () => [], set: () => {} };
`);
writeFileIfMissing('shared/lib/chat-typing.ts', `
export const chatTypingManager = { start: () => {}, stop: () => {} };
`);

// ──────────────────────────────────────────────
// 4. Shared Components
// ──────────────────────────────────────────────
writeFileIfMissing('shared/components/Button.tsx', `
import React, { forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, icon, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 focus:ring-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100',
      outline: 'border border-slate-300 hover:bg-slate-100 text-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm',
      ghost: 'hover:bg-slate-100 text-slate-700 dark:hover:bg-slate-800 dark:text-slate-200',
      link: 'text-blue-600 hover:underline p-0 h-auto',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2.5',
      icon: 'p-2 w-9 h-9',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
`);

writeFileIfMissing('shared/components/Input.tsx', `
import React, { forwardRef } from 'react';
import { cn } from '@/shared/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && <span className="absolute left-3 text-slate-400 pointer-events-none">{leftIcon}</span>}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-slate-50',
              leftIcon ? 'pl-9' : '',
              rightIcon ? 'pr-9' : '',
              error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-700',
              className
            )}
            {...props}
          />
          {rightIcon && <span className="absolute right-3 text-slate-400">{rightIcon}</span>}
        </div>
        {error ? (
          <span className="text-xs text-red-500 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-slate-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
`);

writeFileIfMissing('shared/components/Badge.tsx', `
import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'default', size = 'md', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    primary: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
    danger: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900',
    info: 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900',
    outline: 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
  };

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
`);

writeFileIfMissing('shared/components/DataTable.tsx', `
import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface Column<T> {
  header: string | React.ReactNode;
  accessorKey?: keyof T | string;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-sm', className)}>
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold">
            {columns.map((col, idx) => (
              <th key={idx} className={cn('px-4 py-3.5 whitespace-nowrap', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải dữ liệu...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60',
                  onRowClick ? 'cursor-pointer' : ''
                )}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={cn('px-4 py-3 text-slate-700 dark:text-slate-300', col.className)}>
                    {col.cell ? col.cell(row, rowIdx) : col.accessorKey ? row[col.accessorKey] : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
`);

writeFileIfMissing('shared/components/DataTableAdvanced.tsx', `
export { DataTable as DataTableAdvanced } from './DataTable';
`);

writeFileIfMissing('shared/components/Icon.tsx', `
import React from 'react';
import * as LucideIcons from 'lucide-react';

export interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 18, className }: IconProps) {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
  return <IconComponent size={size} className={className} />;
}
`);

writeFileIfMissing('shared/components/ConfirmDialog.tsx', `
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
`);

writeFileIfMissing('shared/components/ErrorBoundary.tsx', `
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 my-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300">
            <h3 className="font-bold text-base mb-1">Đã xảy ra sự cố hiển thị component này</h3>
            <p className="text-sm">{this.state.error?.message || 'Vui lòng thử lại sau.'}</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
`);

writeFileIfMissing('shared/components/ModuleErrorBoundary.tsx', `
export { ErrorBoundary as ModuleErrorBoundary } from './ErrorBoundary';
`);

writeFileIfMissing('shared/components/Combobox.tsx', `
import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function Combobox({ options, value, onChange, placeholder = 'Chọn...', className }: ComboboxProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      className={cn(
        'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500',
        className
      )}
    >
      <option value="" disabled>{placeholder}</option>
      {(options || []).map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
`);

writeFileIfMissing('shared/components/ComboboxField.tsx', `
export { Combobox as ComboboxField } from './Combobox';
`);

writeFileIfMissing('shared/components/SearchInput.tsx', `
import React from 'react';
import { Input, InputProps } from './Input';
import { Search } from 'lucide-react';

export function SearchInput(props: InputProps) {
  return <Input leftIcon={<Search size={16} />} placeholder="Tìm kiếm..." {...props} />;
}
`);

writeFileIfMissing('shared/components/VPSelect.tsx', `
export { Combobox as VPSelect } from './Combobox';
`);

writeFileIfMissing('shared/components/ViewToggle.tsx', `
import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { Button } from './Button';

export function ViewToggle({ mode, onChange }: { mode: 'grid' | 'list'; onChange: (m: 'grid' | 'list') => void }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-1 bg-slate-100 dark:bg-slate-800">
      <Button
        size="sm"
        variant={mode === 'list' ? 'secondary' : 'ghost'}
        className="px-2 py-1"
        onClick={() => onChange('list')}
      >
        <List size={16} />
      </Button>
      <Button
        size="sm"
        variant={mode === 'grid' ? 'secondary' : 'ghost'}
        className="px-2 py-1"
        onClick={() => onChange('grid')}
      >
        <LayoutGrid size={16} />
      </Button>
    </div>
  );
}
`);

writeFileIfMissing('shared/components/SignaturePad.tsx', `
import React from 'react';
export function SignaturePad({ onSave }: { onSave?: (dataUrl: string) => void }) {
  return <div className="border border-dashed p-8 text-center text-slate-400 rounded-lg">Ký tên điện tử</div>;
}
`);

writeFileIfMissing('shared/components/QRCodeDisplay.tsx', `
import React from 'react';
export function QRCodeDisplay({ value }: { value: string }) {
  return <div className="p-2 border rounded bg-white inline-block text-xs font-mono">{value}</div>;
}
`);

writeFileIfMissing('shared/components/PhoneContact.tsx', `
import React from 'react';
import { Phone } from 'lucide-react';
export function PhoneContact({ phone }: { phone: string }) {
  return (
    <a href={'tel:' + phone} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm font-medium">
      <Phone size={14} />
      <span>{phone}</span>
    </a>
  );
}
`);

writeFileIfMissing('shared/components/Switch.tsx', `
import React from 'react';
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <div className={'w-10 h-6 rounded-full transition-colors ' + (checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700')}>
        <div className={'w-4 h-4 rounded-full bg-white transition-transform mt-1 ml-1 ' + (checked ? 'translate-x-4' : '')} />
      </div>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
}
`);

writeFileIfMissing('shared/components/TabSwitcher.tsx', `
import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function TabSwitcher({ tabs, activeTab, onChange }: { tabs: TabItem[]; activeTab: string; onChange: (id: string) => void }) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2',
            activeTab === t.id
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
`);

writeFileIfMissing('shared/components/Turnstile.tsx', `
import React from 'react';
export function Turnstile({ onVerify }: { onVerify?: (token: string) => void }) {
  return null;
}
`);

writeFileIfMissing('shared/components/AdaptiveSheet.tsx', `
import React from 'react';
export function AdaptiveSheet({ isOpen, onClose, title, children }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full p-6 shadow-xl flex flex-col">
        <div className="flex justify-between items-center pb-4 border-b">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-2">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">{children}</div>
      </div>
    </div>
  );
}
`);

writeFileIfMissing('shared/components/AuthLoadingScreen.tsx', `
import React from 'react';
export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Đang tải ứng dụng...</p>
      </div>
    </div>
  );
}
`);

writeFileIfMissing('shared/components/BasicNumberInput.tsx', `
export { Input as BasicNumberInput } from './Input';
`);

writeFileIfMissing('shared/components/StepperFooter.tsx', `
import React from 'react';
import { Button } from './Button';

export function StepperFooter({ onPrev, onNext, onCancel, currentStep, totalSteps, isSubmitting }: any) {
  return (
    <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
      <Button variant="outline" onClick={onPrev || onCancel}>
        {currentStep === 0 ? 'Hủy bỏ' : 'Quay lại'}
      </Button>
      <Button onClick={onNext} loading={isSubmitting}>
        {currentStep === totalSteps - 1 ? 'Hoàn tất' : 'Tiếp tục'}
      </Button>
    </div>
  );
}
`);

writeFileIfMissing('shared/components/filter-bar/index.tsx', `
import React from 'react';
export function FilterBar({ children }: { children?: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">{children}</div>;
}
`);

writeFileIfMissing('shared/components/status/status.tokens.ts', `
export const STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'danger',
  draft: 'default',
};
`);

writeFileIfMissing('shared/components/index.ts', `
export * from './Button';
export * from './Input';
export * from './Badge';
export * from './DataTable';
export * from './DataTableAdvanced';
export * from './Icon';
export * from './ConfirmDialog';
export * from './ErrorBoundary';
export * from './ModuleErrorBoundary';
export * from './Combobox';
export * from './ComboboxField';
export * from './SearchInput';
export * from './VPSelect';
export * from './ViewToggle';
export * from './SignaturePad';
export * from './QRCodeDisplay';
export * from './PhoneContact';
export * from './Switch';
export * from './TabSwitcher';
export * from './Turnstile';
export * from './AdaptiveSheet';
export * from './AuthLoadingScreen';
export * from './BasicNumberInput';
export * from './StepperFooter';
`);

// ──────────────────────────────────────────────
// 5. Shared Contexts & Hooks
// ──────────────────────────────────────────────
writeFileIfMissing('shared/contexts/ConcurrencyConflictContext.tsx', `
import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

const ConcurrencyConflictContext = createContext<{ conflict: any; resolve: () => void }>({ conflict: null, resolve: () => {} });

export function ConcurrencyConflictProvider({ children }: PropsWithChildren) {
  const [conflict, setConflict] = useState(null);
  return (
    <ConcurrencyConflictContext.Provider value={{ conflict, resolve: () => setConflict(null) }}>
      {children}
    </ConcurrencyConflictContext.Provider>
  );
}

export const useConcurrencyConflict = () => useContext(ConcurrencyConflictContext);
`);

writeFileIfMissing('shared/contexts/GlobalEntityContext.tsx', `
import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

const GlobalEntityContext = createContext<any>({});

export function GlobalEntityProvider({ children }: PropsWithChildren) {
  const [entities, setEntities] = useState({});
  return (
    <GlobalEntityContext.Provider value={{ entities, setEntities }}>
      {children}
    </GlobalEntityContext.Provider>
  );
}

export const useGlobalEntity = () => useContext(GlobalEntityContext);
`);

writeFileIfMissing('shared/context/TenantContext.tsx', `
import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import type { Tenant } from '@/shared/types/database.models';

interface TenantContextType {
  currentTenant: Tenant;
  setTenant: (t: Tenant) => void;
}

const defaultTenant: Tenant = {
  id: 'tenant-vinhphat-001',
  name: 'Công ty Cổ phần Dệt may Vĩnh Phát',
  code: 'VINHPHAT',
  is_active: true,
};

const TenantContext = createContext<TenantContextType>({
  currentTenant: defaultTenant,
  setTenant: () => {},
});

export function TenantProvider({ children }: PropsWithChildren) {
  const [currentTenant, setTenant] = useState<Tenant>(defaultTenant);
  return (
    <TenantContext.Provider value={{ currentTenant, setTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
`);

writeFileIfMissing('shared/context/preferences-context.tsx', `
import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

const PreferencesContext = createContext<any>({ theme: 'light', setTheme: () => {} });

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState('light');
  return (
    <PreferencesContext.Provider value={{ theme, setTheme }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const useUserPreferences = () => useContext(PreferencesContext);
`);

writeFileIfMissing('shared/hooks/useAuth.ts', `
import { useAuth as useFeatureAuth } from '@/features/auth/AuthProvider';
export const useAuth = useFeatureAuth;
`);

writeFileIfMissing('shared/hooks/useConfirm.ts', `
export { useConfirm } from '@/shared/components/ConfirmDialog';
`);

writeFileIfMissing('shared/hooks/useGlobalModal.tsx', `
import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

const GlobalModalContext = createContext<any>({ openModal: () => {}, closeModal: () => {} });

export function GlobalModalProvider({ children }: PropsWithChildren) {
  const [modal, setModal] = useState<any>(null);
  return (
    <GlobalModalContext.Provider value={{ modal, openModal: setModal, closeModal: () => setModal(null) }}>
      {children}
    </GlobalModalContext.Provider>
  );
}

export const useGlobalModal = () => useContext(GlobalModalContext);
`);

writeFileIfMissing('shared/hooks/useNotifications.ts', `
export function useNotifications() {
  return { notifications: [], unreadCount: 0, markAsRead: () => {} };
}
`);

writeFileIfMissing('shared/hooks/useAppBadging.ts', `
export function useAppBadging() { return { setBadge: () => {}, clearBadge: () => {} }; }
`);

writeFileIfMissing('shared/hooks/useClickOutside.ts', `
import { useEffect, RefObject } from 'react';
export function useClickOutside(ref: RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}
`);

writeFileIfMissing('shared/hooks/useColorOptions.ts', `
export function useColorOptions() { return { colors: [], isLoading: false }; }
`);

writeFileIfMissing('shared/hooks/useCompanySettings.ts', `
export function useCompanySettings() { return { settings: {}, isLoading: false }; }
`);

writeFileIfMissing('shared/hooks/useFabricCatalogOptions.ts', `
export function useFabricCatalogOptions() { return { fabrics: [], isLoading: false }; }
`);

writeFileIfMissing('shared/hooks/useNotificationDeepLink.ts', `
export function useNotificationDeepLink() { return { resolveDeepLink: (link: string) => link }; }
`);

writeFileIfMissing('shared/hooks/usePreviewIdFromUrl.ts', `
export function usePreviewIdFromUrl() { return null; }
`);

writeFileIfMissing('shared/hooks/usePushSubscription.ts', `
export function usePushSubscription() { return { isSubscribed: false, subscribe: () => {} }; }
`);

writeFileIfMissing('shared/hooks/useStepper.ts', `
import { useState } from 'react';
export function useStepper(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(0);
  return { currentStep, next: () => setCurrentStep(s => Math.min(s + 1, totalSteps - 1)), prev: () => setCurrentStep(s => Math.max(s - 1, 0)), setStep: setCurrentStep };
}
`);

writeFileIfMissing('shared/hooks/useUrlFilterState.ts', `
import { useState } from 'react';
export function useUrlFilterState<T>(initial: T) {
  const [filters, setFilters] = useState<T>(initial);
  return [filters, setFilters] as const;
}
`);

writeFileIfMissing('shared/hooks/useUserPreferences.ts', `
export { useUserPreferences } from '@/shared/context/preferences-context';
`);

writeFileIfMissing('shared/hooks/useVisualViewport.ts', `
export function useVisualViewport() { return { height: window.innerHeight, width: window.innerWidth }; }
`);

writeFileIfMissing('shared/hooks/index.ts', `
export * from './useAuth';
export * from './useConfirm';
export * from './useGlobalModal';
export * from './useNotifications';
export * from './useUserPreferences';
`);

// ──────────────────────────────────────────────
// 6. Inquiry Cart & Value Components
// ──────────────────────────────────────────────
writeFileIfMissing('shared/inquiry-cart/index.tsx', `
import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

const InquiryCartContext = createContext<any>({ items: [], addItem: () => {}, removeItem: () => {} });

export function InquiryCartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState([]);
  return (
    <InquiryCartContext.Provider value={{ items, addItem: (item: any) => setItems((prev: any) => [...prev, item]), removeItem: () => {} }}>
      {children}
    </InquiryCartContext.Provider>
  );
}

export const useInquiryCart = () => useContext(InquiryCartContext);
`);

writeFileIfMissing('shared/value/core/formatter.ts', `
export { formatCurrency, formatNumber } from '@/shared/utils/format';
`);

writeFileIfMissing('shared/value/core/NumericField.tsx', `
import React from 'react';
import { formatNumber } from '@/shared/utils/format';
export function NumericField({ value, unit }: { value: number | string; unit?: string }) {
  return <span>{formatNumber(value)} {unit || ''}</span>;
}
`);

writeFileIfMissing('shared/value/percentage/PercentageField.tsx', `
import React from 'react';
export function PercentageField({ value }: { value: number | string }) {
  return <span>{value}%</span>;
}
`);

writeFileIfMissing('shared/value/index.ts', `
export * from './core/formatter';
export * from './core/NumericField';
export * from './percentage/PercentageField';
`);

writeFileIfMissing('shared/icons/index.ts', `
export * from 'lucide-react';
`);

writeFileIfMissing('shared/index.ts', `
export * from './components';
export * from './utils/cn';
export * from './utils/format';
`);

writeFileIfMissing('shared/constants/entity.constants.ts', `
export const ENTITY_TYPES = {
  CUSTOMER: 'customer',
  ORDER: 'order',
  SUPPLIER: 'supplier',
};
`);

writeFileIfMissing('shared/constants/layout.ts', `
export const SIDEBAR_WIDTH = 260;
`);

writeFileIfMissing('shared/constants/navigation.ts', `
export const DEFAULT_NAV_ITEMS = [];
`);

writeFileIfMissing('shared/constants/notifications.ts', `
export const NOTIFICATION_CHANNELS = ['in_app', 'email', 'push'];
`);

writeFileIfMissing('shared/constants/ui.constants.ts', `
export const UI_CONSTANTS = {
  MODAL_MAX_WIDTH: 'max-w-2xl',
};
`);

writeFileIfMissing('shared/notifications/deepLinkResolver.ts', `
export function resolveDeepLink(link: string) { return link; }
`);

writeFileIfMissing('shared/services/analytics.ts', `
export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {},
};
`);

// ──────────────────────────────────────────────
// 7. Supabase Services & Integration Bridges
// ──────────────────────────────────────────────
writeFileIfMissing('services/supabase/database.types.ts', `
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
    Views: Record<string, any>;
    Functions: Record<string, any>;
  };
}
`);

writeFileIfMissing('services/supabase/client.ts', `
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Mock in-memory data store for ERP fallback
const mockStore = new Map<string, any[]>();

// Initialize demo datasets for key ERP tables
mockStore.set('customers', [
  { id: 'cust-1', name: 'Công ty May Việt Tiến', phone: '0901234567', email: 'contact@viettien.com.vn', address: 'Quận Tân Bình, TP.HCM', total_orders: 12, debt: 45000000, created_at: new Date().toISOString() },
  { id: 'cust-2', name: 'Tập đoàn Dệt May Phong Phú', phone: '0912345678', email: 'sales@phongphu.com.vn', address: 'TP. Thủ Đức, TP.HCM', total_orders: 8, debt: 0, created_at: new Date().toISOString() },
  { id: 'cust-3', name: 'Công ty TNHH Thời Trang An Phước', phone: '0987654321', email: 'anphuoc@anphuoc.com.vn', address: 'Quận 5, TP.HCM', total_orders: 15, debt: 120000000, created_at: new Date().toISOString() },
]);

mockStore.set('orders', [
  { id: 'ord-101', code: 'DH-2026-001', customer_name: 'Công ty May Việt Tiến', total_amount: 150000000, status: 'in_progress', delivery_date: '2026-09-15', fabric_name: 'Vải Cotton 100% 4 Chiều', quantity: 2500, created_at: new Date().toISOString() },
  { id: 'ord-102', code: 'DH-2026-002', customer_name: 'Tập đoàn Dệt May Phong Phú', total_amount: 85000000, status: 'completed', delivery_date: '2026-08-20', fabric_name: 'Vải CVC 65/35 Cá Sấu', quantity: 1200, created_at: new Date().toISOString() },
]);

mockStore.set('suppliers', [
  { id: 'sup-1', name: 'Nhà cung cấp Sợi Nam Định', phone: '0933112233', contact_person: 'Trần Văn Nam', type: 'yarn', created_at: new Date().toISOString() },
  { id: 'sup-2', name: 'Hóa chất Dệt Nhuộm Tân Bình', phone: '0944556677', contact_person: 'Lê Thị Hoa', type: 'dyeing', created_at: new Date().toISOString() },
]);

function createMockQueryBuilder(table: string) {
  let rows = [...(mockStore.get(table) || [])];
  
  const builder: any = {
    select: (columns = '*') => builder,
    eq: (col: string, val: any) => {
      rows = rows.filter((r) => r[col] === val);
      return builder;
    },
    neq: (col: string, val: any) => {
      rows = rows.filter((r) => r[col] !== val);
      return builder;
    },
    ilike: (col: string, val: any) => {
      const term = String(val).replace(/%/g, '').toLowerCase();
      rows = rows.filter((r) => String(r[col] || '').toLowerCase().includes(term));
      return builder;
    },
    order: () => builder,
    limit: (n: number) => {
      rows = rows.slice(0, n);
      return builder;
    },
    range: (from: number, to: number) => {
      rows = rows.slice(from, to + 1);
      return builder;
    },
    single: async () => ({ data: rows[0] || null, error: null }),
    maybeSingle: async () => ({ data: rows[0] || null, error: null }),
    then: (resolve: (val: any) => void) => resolve({ data: rows, error: null, count: rows.length }),
    insert: async (item: any) => {
      const inserted = Array.isArray(item) ? item : [item];
      const tableData = mockStore.get(table) || [];
      const withIds = inserted.map((i: any) => ({ id: i.id || ('mock-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5)), created_at: new Date().toISOString(), ...i }));
      mockStore.set(table, [...tableData, ...withIds]);
      return { data: withIds, error: null };
    },
    update: async (item: any) => {
      return { data: item, error: null };
    },
    delete: async () => ({ data: null, error: null }),
  };

  return builder;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mock-supabase.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = {
  ...createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  }),
  from: (table: string) => createMockQueryBuilder(table),
  rpc: async (fn: string, params: any) => ({ data: [], error: null }),
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
  }),
  removeChannel: () => {},
};
`);

writeFileIfMissing('services/supabase/tenant.ts', `
import { supabase } from './client';
export function getTenantSupabase() { return supabase; }
`);

writeFileIfMissing('services/supabase/untyped.ts', `
import { supabase } from './client';
export const untypedSupabase = supabase;
`);

writeFileIfMissing('integration/useQueryInvalidationBridge.ts', `
export function useQueryInvalidationBridge() {
  // Query invalidation bridge for ERP realtime updates
}
`);

writeFileIfMissing('integration/useRealtimeInvalidationBridge.ts', `
export function useRealtimeInvalidationBridge() {
  // Realtime events listener bridge
}
`);

writeFileIfMissing('lib/db-guard.ts', `
export function dbGuard() { return true; }
`);

writeFileIfMissing('lib/db-mutation-guard.ts', `
export function dbMutationGuard() { return true; }
`);

writeFileIfMissing('lib/validate-api-input.ts', `
export function validateApiInput(schema: any, data: any) { return data; }
`);

// ──────────────────────────────────────────────
// 8. Schemas (Zod)
// ──────────────────────────────────────────────
writeFileIfMissing('schema/database.types.ts', `
export * from '@/services/supabase/database.types';
`);

const schemaFiles = [
  'api-validation.schema',
  'auth.schema',
  'bom.schema',
  'chat.schema',
  'color.schema',
  'company-settings.schema',
  'contracts.schema',
  'contract-template.schema',
  'cost-estimation.schema',
  'customer.schema',
  'dyeing-order.schema',
  'fabric-catalog.schema',
  'fabric-variant.schema',
  'finished-fabric.schema',
  'loom.schema',
  'order-progress.schema',
  'order-request.schema',
  'order.schema',
  'payment.schema',
  'permissions.schema',
  'purchase-request.schema',
  'quotation.schema',
  'raw-fabric.schema',
  'recurring-transaction.schema',
  'roll.schema',
  'shipment.schema',
  'shipping-rate.schema',
  'sourcing-rfq.schema',
  'supplier.schema',
  'tenant-register.schema',
  'weaving-invoice.schema',
  'work-order.schema',
  'yarn-catalog.schema',
  'yarn-receipt.schema',
];

for (const s of schemaFiles) {
  writeFileIfMissing('schema/' + s + '.ts', `
import { z } from 'zod';

export const baseSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const ` + s.replace(/[-.]/g, '_') + ` = baseSchema;
export default baseSchema;
`);
}

writeFileIfMissing('schema/index.ts', `
export * from './database.types';
`);

console.log('✅ Scaffolding script finished!');
