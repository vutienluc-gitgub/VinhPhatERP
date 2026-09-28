import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';

import { serverSupabase } from '../db/supabase.js';
import { getWebAuthnConfig } from './passkey-config.js';

export class PasskeyRegistrationService {
  /**
   * Generate registration options for an authenticated user
   */
  static async getRegistrationOptions(userId: string) {
    const { rpName, rpID } = getWebAuthnConfig();

    const { data: profile } = await serverSupabase
      .from('profiles')
      .select('full_name, employee_id')
      .eq('id', userId)
      .single();

    let employeeCode = 'NV';
    if (profile?.employee_id) {
      const { data: emp } = await serverSupabase
        .from('employees')
        .select('code')
        .eq('id', profile.employee_id)
        .maybeSingle();
      if (emp?.code) employeeCode = emp.code;
    }

    const { data: existingCreds } = await serverSupabase
      .from('webauthn_credentials')
      .select('credential_id, transports')
      .eq('user_id', userId);

    const excludeCredentials = (existingCreds || []).map((c) => ({
      id: c.credential_id,
      transports: c.transports || undefined,
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: isoUint8Array.fromUTF8String(userId),
      userName: employeeCode,
      userDisplayName: profile?.full_name || employeeCode,
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await serverSupabase.from('webauthn_challenges').insert({
      challenge: options.challenge,
      user_id: userId,
      employee_id: employeeCode,
      type: 'registration',
      expires_at: expiresAt,
    });

    return options;
  }

  /**
   * Verify registration and save credential
   */
  static async verifyRegistration(
    userId: string,
    response: RegistrationResponseJSON,
    friendlyName?: string,
  ) {
    const { expectedOrigins, rpID } = getWebAuthnConfig();

    const { data: challengeRow } = await serverSupabase
      .from('webauthn_challenges')
      .select('id, challenge, employee_id')
      .eq('user_id', userId)
      .eq('type', 'registration')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!challengeRow) {
      throw new Error('Yêu cầu đăng ký đã hết hạn hoặc không hợp lệ.');
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: expectedOrigins,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error('Xác thực chữ ký đăng ký thiết bị thất bại.');
    }

    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    // Delete used challenge
    await serverSupabase
      .from('webauthn_challenges')
      .delete()
      .eq('id', challengeRow.id);

    // Save credential
    const publicKeyBase64 = isoBase64URL.fromBuffer(credential.publicKey);
    const { error: insertErr } = await serverSupabase
      .from('webauthn_credentials')
      .insert({
        user_id: userId,
        employee_id: challengeRow.employee_id || 'NV',
        credential_id: credential.id,
        public_key: publicKeyBase64,
        counter: credential.counter,
        transports: response.response.transports || [],
        device_type: credentialDeviceType,
        backed_up: credentialBackedUp,
        friendly_name: friendlyName || 'Thiết bị bảo mật',
        last_used_at: new Date().toISOString(),
      });

    if (insertErr) {
      throw new Error('Lưu khóa bảo mật thất bại: ' + insertErr.message);
    }

    return { verified: true, credentialId: credential.id };
  }
}
