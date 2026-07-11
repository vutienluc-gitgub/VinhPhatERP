import { AUTH_MESSAGES } from './constants';

export function vietnameseAuthError(message: string): string {
  const msg = message.toLowerCase();

  // Login errors
  if (msg.includes('invalid login credentials'))
    return AUTH_MESSAGES.errorInvalidCredentials;
  if (msg.includes('email not confirmed'))
    return AUTH_MESSAGES.errorEmailNotConfirmed;

  // Register errors
  if (msg.includes('user already registered'))
    return AUTH_MESSAGES.errorUserAlreadyRegistered;

  // Forgot password errors
  if (msg.includes('user not found')) return AUTH_MESSAGES.errorUserNotFound;

  // Common errors
  if (msg.includes('captcha')) return AUTH_MESSAGES.errorCaptchaFailed;
  if (msg.includes('too many requests'))
    return AUTH_MESSAGES.errorTooManyRequests;
  if (msg.includes('network')) return AUTH_MESSAGES.errorNetwork;

  return message;
}
