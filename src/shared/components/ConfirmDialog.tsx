import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from 'react'

type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  alert: (message: string, title?: string) => Promise<void>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}

export function ConfirmProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions & { isAlert?: boolean }>({
    message: '',
  })
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions({ ...opts, isAlert: false })
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const alert = useCallback((message: string, title?: string): Promise<void> => {
    setOptions({ message, title: title ?? 'Thông báo', isAlert: true })
    setOpen(true)
    return new Promise<void>((resolve) => {
      resolveRef.current = () => resolve()
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setOpen(false)
    resolveRef.current?.(true)
    resolveRef.current = null
  }, [])

  const handleCancel = useCallback(() => {
    setOpen(false)
    resolveRef.current?.(false)
    resolveRef.current = null
  }, [])

  const value = useMemo(() => ({ confirm, alert }), [confirm, alert])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {open && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div
            className="modal-sheet"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
          >
            <div className="modal-header">
              <h3 id="confirm-dialog-title">{options.title ?? 'Xác nhận'}</h3>
            </div>
            <p id="confirm-dialog-message" style={{ margin: '0 0 0.5rem', lineHeight: 1.5 }}>
              {options.message}
            </p>
            <div className="modal-actions">
              {!options.isAlert && (
                <button className="secondary-button" type="button" onClick={handleCancel}>
                  {options.cancelLabel ?? 'Huỷ'}
                </button>
              )}
              <button
                className={options.variant === 'danger' ? 'danger-button' : 'primary-button'}
                type="button"
                onClick={handleConfirm}
                autoFocus
              >
                {options.isAlert
                  ? 'OK'
                  : (options.confirmLabel ?? 'Xác nhận')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
