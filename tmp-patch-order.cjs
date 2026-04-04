const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'src/features/orders/OrderForm.tsx')
let content = fs.readFileSync(filePath, 'utf-8')

// 1. Imports
content = content.replace(
  /import \{[^\}]*useCreateOrder,[^\}]*\} from '\.\/useOrders'/s,
  `import {
  useNextOrderNumber,
  useUpdateOrder,
} from './useOrders'
import { useCreateOrderV2, isCreditWarning, type CreateOrderError } from './useCreateOrderV2'
import { CreditOverrideDialog } from './CreditOverrideDialog'
import { useState } from 'react'
import { useAuth } from '@/features/auth/AuthProvider'`
)

// 2. State & Hooks
content = content.replace(
  /(export function OrderForm\(\{[^\}]*\}\) \{\s+const isEditing = order !== null\s+)const createMutation = useCreateOrder\(\)\s+const updateMutation = useUpdateOrder\(\)\s+const \{ data: nextNumber \} = useNextOrderNumber\(\)/g,
  `$1const { profile } = useAuth()
  const [overrideWarning, setOverrideWarning] = useState<CreateOrderError | null>(null)

  const createMutationV2 = useCreateOrderV2()
  const updateMutation = useUpdateOrder()
  const { data: nextNumber } = useNextOrderNumber()`
)

// 3. onSubmit & handleOverride
content = content.replace(
  /async function onSubmit\(values: OrdersFormValues\) \{\s+try \{\s+if \(isEditing\) \{\s+await updateMutation\.mutateAsync\(\{ id: order\.id, values \}\)\s+\} else \{\s+await createMutation\.mutateAsync\(values\)\s+\}\s+onClose\(\)\s+\} catch \{\s+\/\/ Error displayed via mutationError below\s+\}\s+\}/g,
  `async function onSubmit(values: OrdersFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: order.id, values })
        onClose()
      } else {
        await createMutationV2.mutateAsync(values)
        onClose()
      }
    } catch (err) {
      if (!isEditing && err && typeof err === 'object' && 'code' in err) {
        const e = err as CreateOrderError
        if (isCreditWarning(e.code)) {
          setOverrideWarning(e)
        } else {
          // Error handled by mutationError
        }
      }
    }
  }

  async function handleOverride() {
    try {
      if (overrideWarning) {
        const values = control._formValues as OrdersFormValues
        await createMutationV2.mutateAsync({ ...values, managerOverride: true } as CreateOrderInput)
        setOverrideWarning(null)
        onClose()
      }
    } catch (err) {
      // Error handled by mutationError
    }
  }`
)

// In onSubmit, change createMutation to createMutationV2
content = content.replace(/createMutation\.error/g, 'createMutationV2.error')
content = content.replace(/createMutation\.isPending/g, 'createMutationV2.isPending')

// Also fix CreateOrderInput reference since we might need to import it
content = content.replace(
  `import { useCreateOrderV2, isCreditWarning, type CreateOrderError } from './useCreateOrderV2'`,
  `import { useCreateOrderV2, isCreditWarning, type CreateOrderError, type CreateOrderInput } from './useCreateOrderV2'`
)

// 4. Modal Dialog
content = content.replace(
  /(<div className="modal-footer">.*?<\/form>\s+<\/div>\s+)(<\/div>\s+\)\s+\})/s,
  `$1
      <CreditOverrideDialog
        open={!!overrideWarning}
        code={overrideWarning?.code || 'CREDIT_LIMIT_EXCEEDED'}
        message={overrideWarning?.message || ''}
        detail={overrideWarning?.detail}
        userRole={profile?.role || 'staff'}
        onConfirm={handleOverride}
        onCancel={() => setOverrideWarning(null)}
        isLoading={createMutationV2.isPending}
      />
    $2`
)

fs.writeFileSync(filePath, content, 'utf-8')
console.log('Patched OrderForm.tsx successfully')
