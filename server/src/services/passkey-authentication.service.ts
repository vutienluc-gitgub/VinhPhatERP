import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransport,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

import { serverSupabase } from '../db/supabase.js';
import { mintSupabaseJwt } from '../utils/jwt.js';
import { getWebAuthnConfig } from './passkey-config.js';

export class PasskeyAuthenticationService {
  /**
   * Look up user by employee code, full email, or email username
   */
  static async findUserByIdentifier(identifier: string) {
    const cleanId = identifier.trim().toLowerCase();

    // 1. Check in employees by code
    const { data: emp } = await serverSupabase
      .from('employees')
      .select('id, code, name')
      .ilike('code', cleanId)
      .maybeSingle();

    if (emp) {
      const { data: profile } = await serverSupabase
        .from('profiles')
        .select('id, full_name, role, is_active')
        .eq('employee_id', emp.id)
        .maybeSingle();

      if (profile) {
        return {
          userId: profile.id,
          employeeCode: emp.code,
          fullName: profile.full_name || emp.name,
          role: profile.role,
        };
      }
    }

    // 2. Check in auth.users by email or username
    const { data: usersData } = await serverSupabase.auth.admin.listUsers();
    const matchingUser = usersData?.users.find((u) => {
      const email = u.email?.toLowerCase() || '';
      return email === cleanId || email.split('@')[0] === cleanId;
    });

    if (matchingUser) {
      const { data: profile } = await serverSupabase
        .from('profiles')
        .select('full_name, role, is_active, employee_id')
        .eq('id', matchingUser.id)
        .maybeSingle();

      let employeeCode = cleanId;
      if (profile?.employee_id) {
        const { data: empData } = await serverSupabase
          .from('employees')
          .select('code')
          .eq('id', profile.employee_id)
          .maybeSingle();
        if (empData?.code) employeeCode = empData.code;
      }

      return {
        userId: matchingUser.id,
        email: matchingUser.email,
        employeeCode,
        fullName: profile?.full_name || matchingUser.email || '',
        role: profile?.role || 'staff',
      };
    }

    return null;
  }

  /**
   * Generate login options
   */
  static async getLoginOptions(identifier?: string) {
    const { rpID } = getWebAuthnConfig();
    let allowCredentials:
      | { id: string; transports?: AuthenticatorTransport[] }[]
      | undefined;
    let userId: string | null = null;
    let employeeCode: string | null = null;

    if (identifier) {
      const user = await this.findUserByIdentifier(identifier);
      if (!user) {
        throw new Error(
          'KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n vá»›i mÃ£ Ä‘á»‹nh danh Ä‘Ã£ nháº­p.',
        );
      }

      userId = user.userId;
      employeeCode = user.employeeCode;

      const { data: creds } = await serverSupabase
        .from('webauthn_credentials')
        .select('credential_id, transports')
        .eq('user_id', user.userId);

      if (!creds || creds.length === 0) {
        throw new Error(
          'TÃ i khoáº£n nÃ y chÆ°a Ä‘Äƒng kÃ½ khÃ³a Passkey. Vui lÃ²ng Ä‘Äƒng nháº­p báº±ng máº­t kháº©u hoáº·c Google trÆ°á»›c.',
        );
      }

      allowCredentials = creds.map((c) => ({
        id: c.credential_id,
        transports: c.transports || undefined,
      }));
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await serverSupabase.from('webauthn_challenges').insert({
      challenge: options.challenge,
      user_id: userId,
      employee_id: employeeCode,
      type: 'authentication',
      expires_at: expiresAt,
    });

    return options;
  }

  /**
   * Verify authentication and mint Supabase JWT
   */
  static async verifyLogin(response: AuthenticationResponseJSON) {
    const { expectedOrigins, rpID } = getWebAuthnConfig();

    const { data: cred } = await serverSupabase
      .from('webauthn_credentials')
      .select('*')
      .eq('credential_id', response.id)
      .maybeSingle();

    if (!cred) {
      throw new Error(
        'KhÃ³a báº£o máº­t khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ bá»‹ thu há»“i.',
      );
    }

    const { data: challengeRow } = await serverSupabase
      .from('webauthn_challenges')
      .select('id, challenge')
      .eq('type', 'authentication')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!challengeRow) {
      throw new Error(
        'PhiÃªn xÃ¡c thá»±c Ä‘Ã£ háº¿t háº¡n. Vui lÃ²ng thá»­ láº¡i.',
      );
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: expectedOrigins,
      expectedRPID: rpID,
      credential: {
        id: cred.credential_id,
        publicKey: isoBase64URL.toBuffer(cred.public_key),
        counter: Number(cred.counter),
        transports: cred.transports || undefined,
      },
      requireUserVerification: false,
    });

    if (!verification.verified) {
      throw new Error('XÃ¡c thá»±c chá»¯ kÃ½ Passkey khÃ´ng há»£p lá»‡.');
    }

    // Update counter & last_used_at
    await serverSupabase
      .from('webauthn_credentials')
      .update({
        counter: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', cred.id);

    // Delete used challenge
    await serverSupabase
      .from('webauthn_challenges')
      .delete()
      .eq('id', challengeRow.id);

    // Fetch user details to mint Supabase JWT
    const { data: profile } = await serverSupabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', cred.user_id)
      .single();

    const { data: authUser } = await serverSupabase.auth.admin.getUserById(
      cred.user_id,
    );

    const token = await mintSupabaseJwt({
      userId: cred.user_id,
      email: authUser?.user?.email,
      role: profile?.role || 'authenticated',
      employeeId: cred.employee_id,
      fullName: profile?.full_name,
    });

    return {
      verified: true,
      session: {
        access_token: token,
        token_type: 'bearer',
        expires_in: 604800, // 7 days
        user: {
          id: cred.user_id,
          email: authUser?.user?.email,
          role: profile?.role || 'authenticated',
          app_metadata: { provider: 'passkey' },
          user_metadata: {
            employee_id: cred.employee_id,
            full_name: profile?.full_name,
          },
        },
      },
    };
  }
}
