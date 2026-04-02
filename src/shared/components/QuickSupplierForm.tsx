import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/services/supabase/client'

/* ── Minimal schema for quick-create (only required fields) ── */

const CATEGORIES = ['yarn', 'dye', 'weaving', 'accessories', 'other'] as const

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  yarn: 'Sợi',
  dye: 'Thuốc nhuộm',
  weaving: 'Nhà dệt',
  accessories: 'Phụ liệu',
  other: 'Khác',
}

const quickSupplierSchema = z.object({
  code: z.string().min(1, 'Mã NCC là bắt buộc'),
  name: z.string().min(1, 'Tên NCC là bắt buộc'),
  category: z.enum(CATEGORIES),
  phone: z.string().optional(),
})

type QuickSupplierValues = z.infer<typeof quickSupplierSchema>

type QuickSupplierFormProps = {
  /** Pre-select category, e.g. 'yarn' for yarn receipt, 'weaving' for raw fabric */
  defaultCategory?: (typeof CATEGORIES)[number]
  onCreated: (supplier: { id: string; code: string; name: string }) => void
  onCancel: () => void
}

function useNextSupplierCode() {
  return useQuery({
    queryKey: ['suppliers', 'next-code'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('code')
        .ilike('code', 'NCC-%')
        .order('code', { ascending: false })
        .limit(1)
      if (error) throw error
      if (!data || data.length === 0) return 'NCC-001'
      const first = data[0]
      if (!first) return 'NCC-001'
      const match = first.code.match(/^NCC-(\d+)$/)
      if (!match?.[1]) return 'NCC-001'
      const nextNum = parseInt(match[1], 10) + 1
      return `NCC-${String(nextNum).padStart(3, '0')}`
    },
  })
}

function useQuickCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: QuickSupplierValues) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          code: values.code,
          name: values.name,
          category: values.category,
          phone: values.phone?.trim() || null,
          status: 'active',
        }])
        .select('id, code, name')
        .single()
      if (error) throw error
      return data as { id: string; code: string; name: string }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

export function QuickSupplierForm({ defaultCategory = 'other', onCreated, onCancel }: QuickSupplierFormProps) {
  const { data: nextCode } = useNextSupplierCode()
  const createMutation = useQuickCreateSupplier()
  const [show, setShow] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuickSupplierValues>({
    resolver: zodResolver(quickSupplierSchema),
    defaultValues: {
      code: '',
      name: '',
      category: defaultCategory,
      phone: '',
    },
  })

  useEffect(() => {
    if (nextCode) setValue('code', nextCode)
  }, [nextCode, setValue])

  if (!show) return null

  async function onSubmit(values: QuickSupplierValues) {
    try {
      const result = await createMutation.mutateAsync(values)
      setShow(false)
      onCreated(result)
    } catch {
      // error shown below
    }
  }

  const isPending = isSubmitting || createMutation.isPending

  return (
    <div
      style={{
        border: '1.5px solid var(--primary)',
        borderRadius: 'var(--radius-sm)',
        padding: '0.75rem',
        background: 'rgba(11, 107, 203, 0.03)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
          + Tạo NCC nhanh
        </span>
        <button
          className="btn-icon"
          type="button"
          onClick={onCancel}
          aria-label="Đóng"
          style={{ width: 26, height: 26, fontSize: '0.8rem' }}
        >
          ✕
        </button>
      </div>

      {createMutation.error && (
        <p style={{ color: '#c0392b', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
          {(createMutation.error as Error).message}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid" style={{ gap: '0.6rem' }}>
          <div className="form-grid form-grid-2">
            <div className="form-field">
              <label style={{ fontSize: '0.75rem' }}>Mã NCC</label>
              <input
                className={`field-input${errors.code ? ' is-error' : ''}`}
                type="text"
                readOnly
                {...register('code')}
              />
            </div>
            <div className="form-field">
              <label style={{ fontSize: '0.75rem' }}>Danh mục</label>
              <select className="field-select" {...register('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label style={{ fontSize: '0.75rem' }}>
              Tên NCC <span className="field-required">*</span>
            </label>
            <input
              className={`field-input${errors.name ? ' is-error' : ''}`}
              type="text"
              placeholder="VD: Công ty TNHH ABC"
              autoFocus
              {...register('name')}
            />
            {errors.name && <span className="field-error">{errors.name.message}</span>}
          </div>

          <div className="form-field">
            <label style={{ fontSize: '0.75rem' }}>SĐT</label>
            <input
              className="field-input"
              type="tel"
              placeholder="VD: 0901 234 567"
              {...register('phone')}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" type="button" onClick={onCancel} disabled={isPending} style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}>
              Hủy
            </button>
            <button className="primary-button" type="submit" disabled={isPending} style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}>
              {isPending ? 'Đang tạo…' : 'Tạo NCC'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
