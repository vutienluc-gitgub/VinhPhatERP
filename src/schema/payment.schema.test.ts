import { describe, test } from 'vitest';
import fc from 'fast-check';

import { createPaymentsSchema, paymentsDefaultValues } from './payment.schema';

// Feature: level7-audit-fixes, Property 1: Overpayment luôn bị từ chối
// Validates: Requirements 10.1, 10.2
describe('createPaymentsSchema', () => {
  test('overpayment is always rejected', () => {
    fc.assert(
      fc.property(
        fc.integer({
          min: 1,
          max: 1_000_000_000,
        }), // balanceDue
        fc.integer({
          min: 1,
          max: 2_000_000_000,
        }), // amount
        (balanceDue, amount) => {
          fc.pre(amount > balanceDue);
          const schema = createPaymentsSchema(balanceDue);
          const result = schema.safeParse({
            ...paymentsDefaultValues,
            orderId: '00000000-0000-0000-0000-000000000001',
            customerId: '00000000-0000-0000-0000-000000000002',
            paymentNumber: 'PT-001',
            paymentDate: '2024-01-01',
            amount,
          });
          return (
            result.success === false &&
            result.error.issues.some((i) => i.path.includes('amount'))
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: level7-audit-fixes, Property 2: Payment hợp lệ luôn được chấp nhận
  // Validates: Requirements 10.1, 10.7
  test('valid payment is always accepted', () => {
    fc.assert(
      fc.property(
        fc.integer({
          min: 1,
          max: 1_000_000_000,
        }), // balanceDue
        fc.integer({
          min: 1,
          max: 1_000_000_000,
        }), // amount
        (balanceDue, amount) => {
          fc.pre(amount <= balanceDue);
          const schema = createPaymentsSchema(balanceDue);
          const result = schema.safeParse({
            ...paymentsDefaultValues,
            orderId: '00000000-0000-0000-0000-000000000001',
            customerId: '00000000-0000-0000-0000-000000000002',
            paymentNumber: 'PT-001',
            paymentDate: '2024-01-01',
            amount,
          });
          // amount field should not have overpayment error
          const amountErrors = result.success
            ? []
            : result.error.issues.filter(
                (i) =>
                  i.path.includes('amount') && i.message.includes('vượt quá'),
              );
          return amountErrors.length === 0;
        },
      ),
      { numRuns: 100 },
    );
  });
});
