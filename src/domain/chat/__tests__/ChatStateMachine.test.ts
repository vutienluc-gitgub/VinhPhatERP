import { describe, it, expect } from 'vitest';

import {
  messageSendStateMachine,
  mapSendStateToPresentationStatus,
  canSendMessage,
  isMessageFailed,
} from '@/domain/chat';

describe('Chat Domain - MessageSendStateMachine', () => {
  it('correctly transitions through happy path: idle -> pending -> sent', () => {
    expect(messageSendStateMachine.canTransition('idle', 'start_send')).toBe(
      true,
    );
    const pendingState = messageSendStateMachine.apply('idle', 'start_send');
    expect(pendingState).toBe('pending');

    expect(
      messageSendStateMachine.canTransition('pending', 'send_success'),
    ).toBe(true);
    const sentState = messageSendStateMachine.apply('pending', 'send_success');
    expect(sentState).toBe('sent');

    // Sent is terminal for this cycle
    expect(messageSendStateMachine.allowedTransitions('sent')).toEqual([]);
  });

  it('correctly transitions through failure and retry: pending -> failed -> retrying -> sent', () => {
    const failedState = messageSendStateMachine.apply('pending', 'send_error');
    expect(failedState).toBe('failed');
    expect(isMessageFailed(failedState)).toBe(true);

    const retryingState = messageSendStateMachine.apply('failed', 'retry');
    expect(retryingState).toBe('retrying');

    const recoveredState = messageSendStateMachine.apply(
      'retrying',
      'send_success',
    );
    expect(recoveredState).toBe('sent');
  });

  it('blocks invalid transitions and throws error', () => {
    expect(messageSendStateMachine.canTransition('sent', 'retry')).toBe(false);
    expect(() => messageSendStateMachine.apply('sent', 'retry')).toThrowError();
  });

  it('maps MessageSendState to presentation status correctly', () => {
    expect(mapSendStateToPresentationStatus('pending')).toBe('sending');
    expect(mapSendStateToPresentationStatus('retrying')).toBe('sending');
    expect(mapSendStateToPresentationStatus('sent')).toBe('sent');
    expect(mapSendStateToPresentationStatus('failed')).toBe('failed');
  });

  it('checks room permission to send message', () => {
    expect(canSendMessage('active')).toBe(true);
    expect(canSendMessage('closed')).toBe(false);
  });
});
