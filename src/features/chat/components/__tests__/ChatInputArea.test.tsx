import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CHAT_LABELS } from '@/schema/chat.schema';
import { ChatInputArea } from '@/features/chat/components/ChatInputArea';

const toastErrorMock = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: { error: (...args: unknown[]) => toastErrorMock(...args) },
}));

vi.mock('@/shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-me' },
    profile: { id: 'user-me', role: 'staff' },
    loading: false,
  }),
}));

vi.mock('@/shared/lib/chat-audio', () => ({
  chatAudio: { playSentSound: vi.fn(), playReceivedSound: vi.fn() },
}));

vi.mock('@/shared/lib/chat-storage', () => ({
  uploadChatImage: vi.fn(),
  uploadChatFile: vi.fn(),
  getChatThumbnailUrl: (url: string) => url,
}));

vi.mock('@/application/chat', () => ({
  useMentionsSearch: () => ({ data: [] }),
}));

describe('ChatInputArea — Zero Message Loss', () => {
  beforeEach(() => {
    toastErrorMock.mockClear();
  });

  it('keeps the typed text when the room is not ready (roomId undefined)', () => {
    const onSend = vi.fn();

    render(<ChatInputArea onSend={onSend} roomId={undefined} />);

    const textarea = screen.getByLabelText(CHAT_LABELS.TYPE_MESSAGE);
    fireEvent.change(textarea, { target: { value: 'Alo' } });
    expect(textarea).toHaveValue('Alo');

    fireEvent.click(screen.getByLabelText(CHAT_LABELS.SEND));

    expect(onSend).not.toHaveBeenCalled();
    // The message must NOT be wiped from the composer
    expect(textarea).toHaveValue('Alo');
    expect(toastErrorMock).toHaveBeenCalledWith(CHAT_LABELS.ROOM_INITIALIZING);
  });

  it('keeps the typed text when onSend explicitly rejects the message', () => {
    const onSend = vi.fn().mockReturnValue(false);

    render(<ChatInputArea onSend={onSend} roomId="room-1" />);

    const textarea = screen.getByLabelText(CHAT_LABELS.TYPE_MESSAGE);
    fireEvent.change(textarea, { target: { value: 'Alo' } });

    fireEvent.click(screen.getByLabelText(CHAT_LABELS.SEND));

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue('Alo');
  });

  it('clears the composer only after onSend accepts the message', () => {
    const onSend = vi.fn().mockReturnValue(true);

    render(<ChatInputArea onSend={onSend} roomId="room-1" />);

    const textarea = screen.getByLabelText(CHAT_LABELS.TYPE_MESSAGE);
    fireEvent.change(textarea, { target: { value: 'Alo' } });

    fireEvent.click(screen.getByLabelText(CHAT_LABELS.SEND));

    expect(onSend).toHaveBeenCalledWith('Alo', undefined);
    expect(textarea).toHaveValue('');
  });

  it('sends on Enter and retains text if the send is rejected', () => {
    const onSend = vi.fn().mockReturnValue(false);

    render(<ChatInputArea onSend={onSend} roomId="room-1" />);

    const textarea = screen.getByLabelText(CHAT_LABELS.TYPE_MESSAGE);
    fireEvent.change(textarea, { target: { value: 'Alo' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(textarea).toHaveValue('Alo');
  });
});
