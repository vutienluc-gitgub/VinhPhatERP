/**
 * Delivery Exception Domain Types (Pure TypeScript - Domain Layer)
 * Manages exceptions, issues, and customer absence during delivery.
 */

export type DeliveryExceptionType =
  | 'CUSTOMER_ABSENT'
  | 'WRONG_ADDRESS'
  | 'REJECTED_DEFECT'
  | 'CONTACT_UNREACHABLE'
  | 'FORCE_MAJEURE';

export type DeliveryExceptionStatus = 'OPEN' | 'RESOLVED' | 'ABANDONED';

export type ExceptionResolutionAction =
  | 'RETRY_NEXT_DAY'
  | 'RETURN_WAREHOUSE'
  | 'REDISPATCH';

export interface DeliveryException {
  id: string;
  tenantId: string;
  attemptId: string;
  exceptionType: DeliveryExceptionType;
  reasonDetail: string;
  status: DeliveryExceptionStatus;
  reportedBy: string;
  reportedAt: string;
  resolutionAction?: ExceptionResolutionAction | null;
  resolutionNotes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
}
