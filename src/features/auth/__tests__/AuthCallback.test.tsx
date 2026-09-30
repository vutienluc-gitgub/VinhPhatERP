import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AuthCallback } from '@/features/auth/AuthCallback';
import * as useAuthCallbackModule from '@/features/auth/useAuthCallback';
import { AUTH_CALLBACK } from '@/features/auth/auth-callback.constants';

describe('AuthCallback', () => {
  const mockGoToLogin = vi.fn();
  const mockGoToDashboard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner and text while processing', () => {
    vi.spyOn(useAuthCallbackModule, 'useAuthCallback').mockReturnValue({
      status: 'processing',
      errorMessage: null,
      goToLogin: mockGoToLogin,
      goToDashboard: mockGoToDashboard,
    });

    render(<AuthCallback />);

    expect(screen.getByText(AUTH_CALLBACK.LOADING_TEXT)).toBeInTheDocument();
  });

  it('renders success state when status is success', () => {
    vi.spyOn(useAuthCallbackModule, 'useAuthCallback').mockReturnValue({
      status: 'success',
      errorMessage: null,
      goToLogin: mockGoToLogin,
      goToDashboard: mockGoToDashboard,
    });

    render(<AuthCallback />);

    expect(screen.getByText(AUTH_CALLBACK.SUCCESS_TEXT)).toBeInTheDocument();
  });

  it('renders error state and triggers goToLogin on click', () => {
    vi.spyOn(useAuthCallbackModule, 'useAuthCallback').mockReturnValue({
      status: 'error',
      errorMessage: 'Invalid OAuth token',
      goToLogin: mockGoToLogin,
      goToDashboard: mockGoToDashboard,
    });

    render(<AuthCallback />);

    expect(screen.getByText(AUTH_CALLBACK.ERROR_TITLE)).toBeInTheDocument();
    expect(screen.getByText('Invalid OAuth token')).toBeInTheDocument();

    const button = screen.getByRole('button', {
      name: AUTH_CALLBACK.BACK_TO_LOGIN,
    });
    fireEvent.click(button);
    expect(mockGoToLogin).toHaveBeenCalledTimes(1);
  });

  it('reveals manual fallback buttons after timeout when still processing', () => {
    vi.useFakeTimers();
    vi.spyOn(useAuthCallbackModule, 'useAuthCallback').mockReturnValue({
      status: 'processing',
      errorMessage: null,
      goToLogin: mockGoToLogin,
      goToDashboard: mockGoToDashboard,
    });

    render(<AuthCallback />);

    expect(
      screen.queryByText(AUTH_CALLBACK.GO_TO_DASHBOARD),
    ).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const dashboardBtn = screen.getByRole('button', {
      name: AUTH_CALLBACK.GO_TO_DASHBOARD,
    });
    expect(dashboardBtn).toBeInTheDocument();

    fireEvent.click(dashboardBtn);
    expect(mockGoToDashboard).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });
});
