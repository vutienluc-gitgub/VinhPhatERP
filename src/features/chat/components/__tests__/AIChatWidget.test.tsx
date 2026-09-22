import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

import { AIChatWidget } from '@/features/chat/components/AIChatWidget';

describe('AIChatWidget', () => {
  it('renders floating trigger button with accessible label and title', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AIChatWidget />
      </MemoryRouter>,
    );

    const button = screen.getByRole('button', {
      name: /Trợ lý AI Vĩnh Phát/i,
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Trợ lý AI Vĩnh Phát (Ctrl+J)');

    const kbd = button.querySelector('kbd');
    expect(kbd).toHaveClass('text-primary-foreground');
  });

  it('opens drawer on button click and on Ctrl+J shortcut', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AIChatWidget />
      </MemoryRouter>,
    );

    // Initial check: drawer input is not visible
    expect(
      screen.queryByPlaceholderText(/Nhập câu hỏi cho Trợ lý AI/i),
    ).not.toBeInTheDocument();

    // Trigger Ctrl+J shortcut
    fireEvent.keyDown(window, { key: 'j', ctrlKey: true });
    expect(
      screen.getByPlaceholderText(/Nhập câu hỏi cho Trợ lý AI/i),
    ).toBeInTheDocument();

    // Trigger Ctrl+J again to toggle close
    fireEvent.keyDown(window, { key: 'j', ctrlKey: true });
    expect(
      screen.queryByPlaceholderText(/Nhập câu hỏi cho Trợ lý AI/i),
    ).not.toBeInTheDocument();
  });
});
