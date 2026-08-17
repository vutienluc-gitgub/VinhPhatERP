import { describe, expect, it } from 'vitest';

import {
  orderStateMachine,
  isOrderEditable,
  canConfirmOrder,
  canCancelOrder,
  isOrderTerminal,
} from '@/domain/orders/OrderStateMachine';

describe('OrderStateMachine', () => {
  describe('State Transitions', () => {
    it('allows valid lifecycle transitions from draft to completed', () => {
      // draft -> confirm -> confirmed
      expect(orderStateMachine.canTransition('draft', 'confirm')).toBe(true);
      expect(orderStateMachine.apply('draft', 'confirm')).toBe('confirmed');

      // confirmed -> start_production -> in_progress
      expect(
        orderStateMachine.canTransition('confirmed', 'start_production'),
      ).toBe(true);
      expect(orderStateMachine.apply('confirmed', 'start_production')).toBe(
        'in_progress',
      );

      // in_progress -> complete -> completed
      expect(orderStateMachine.canTransition('in_progress', 'complete')).toBe(
        true,
      );
      expect(orderStateMachine.apply('in_progress', 'complete')).toBe(
        'completed',
      );
    });

    it('allows cancellation from draft or confirmed', () => {
      expect(orderStateMachine.canTransition('draft', 'cancel')).toBe(true);
      expect(orderStateMachine.apply('draft', 'cancel')).toBe('cancelled');

      expect(orderStateMachine.canTransition('confirmed', 'cancel')).toBe(true);
      expect(orderStateMachine.apply('confirmed', 'cancel')).toBe('cancelled');
    });

    it('disallows invalid transitions', () => {
      // Cannot complete directly from draft
      expect(orderStateMachine.canTransition('draft', 'complete')).toBe(false);
      expect(() => orderStateMachine.apply('draft', 'complete')).toThrow();

      // Cannot confirm an in_progress order
      expect(orderStateMachine.canTransition('in_progress', 'confirm')).toBe(
        false,
      );
      expect(() => orderStateMachine.apply('in_progress', 'confirm')).toThrow();

      // Completed is terminal
      expect(orderStateMachine.allowedTransitions('completed')).toEqual([]);
      expect(orderStateMachine.canTransition('completed', 'cancel')).toBe(
        false,
      );
    });
  });

  describe('Guards', () => {
    it('correctly evaluates isOrderEditable', () => {
      expect(isOrderEditable('draft')).toBe(true);
      expect(isOrderEditable('pending_review')).toBe(true);
      expect(isOrderEditable('confirmed')).toBe(false);
      expect(isOrderEditable('confirmed', true)).toBe(true); // admin can edit non-terminal
      expect(isOrderEditable('completed', true)).toBe(false); // terminal cannot be edited
    });

    it('correctly evaluates canConfirmOrder', () => {
      expect(canConfirmOrder('draft')).toBe(true);
      expect(canConfirmOrder('confirmed')).toBe(false);
      expect(canConfirmOrder('in_progress')).toBe(false);
    });

    it('correctly evaluates canCancelOrder', () => {
      expect(canCancelOrder('draft')).toBe(true);
      expect(canCancelOrder('confirmed')).toBe(true);
      expect(canCancelOrder('in_progress')).toBe(false);
      expect(canCancelOrder('completed')).toBe(false);
    });

    it('correctly evaluates isOrderTerminal', () => {
      expect(isOrderTerminal('completed')).toBe(true);
      expect(isOrderTerminal('cancelled')).toBe(true);
      expect(isOrderTerminal('draft')).toBe(false);
      expect(isOrderTerminal('in_progress')).toBe(false);
    });
  });
});
