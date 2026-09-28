import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/server';

import { getWebAuthnConfig, type WebAuthnConfig } from './passkey-config.js';
import { PasskeyRegistrationService } from './passkey-registration.service.js';
import { PasskeyAuthenticationService } from './passkey-authentication.service.js';

export { getWebAuthnConfig, type WebAuthnConfig };

export class PasskeyService {
  static findUserByIdentifier(identifier: string) {
    return PasskeyAuthenticationService.findUserByIdentifier(identifier);
  }

  static getRegistrationOptions(userId: string) {
    return PasskeyRegistrationService.getRegistrationOptions(userId);
  }

  static verifyRegistration(
    userId: string,
    response: RegistrationResponseJSON,
    friendlyName?: string,
  ) {
    return PasskeyRegistrationService.verifyRegistration(
      userId,
      response,
      friendlyName,
    );
  }

  static getLoginOptions(identifier?: string) {
    return PasskeyAuthenticationService.getLoginOptions(identifier);
  }

  static verifyLogin(response: AuthenticationResponseJSON) {
    return PasskeyAuthenticationService.verifyLogin(response);
  }
}
