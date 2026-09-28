import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import { isoBase64URL, isoUint8Array } from '@simplewebauthn/server/helpers';

import { serverSupabase } from '../db/supabase.js';
import { mintSupabaseJwt } from '../utils/jwt.js';

export interface WebAuthnConfig {
  rpName: string;
  rpID: string;
  expectedOrigins: string[];
}

export function getWebAuthnConfig(): WebAuthnConfig {
  const rpName = 'Dệt May Vĩnh Phát ERP';
  const rpID =
    process.env.WEBAUTHN_RP_ID ||
    (process.env.NODE_ENV === 'production'
      ? 'quantri.detmayvinhphat.com'
      : 'localhost');

  const defaultOrigins = [
    'https://quantri.detmayvinhphat.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  if (process.env.ALLOWED_ORIGINS) {
    const extra = process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
    defaultOrigins.push(...extra);
  }

  const expectedOrigins = Array.from(new Set(defaultOrigins));

  return { rpName, rpID, expectedOrigins };
}

export class PasskeyService {
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
   * Step 1: Generate registration options for an authenticated user
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
   * Step 2: Verify registration and save credential
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

  /**
   * Step 3: Generate login options
   */
  static async getLoginOptions(identifier?: string) {
    const { rpID } = getWebAuthnConfig();
    let allowCredentials: { id: string; transports?: any[] }[] | undefined;
    let userId: string | null = null;
    let employeeCode: string | null = null;

    if (identifier) {
      const user = await this.findUserByIdentifier(identifier);
      if (!user) {
        throw new Error('Không tìm thấy tài khoản với mã định danh đã nhập.');
      }

      userId = user.userId;
      employeeCode = user.employeeCode;

      const { data: creds } = await serverSupabase
        .from('webauthn_credentials')
        .select('credential_id, transports')
        .eq('user_id', user.userId);

      if (!creds || creds.length === 0) {
        throw new Error(
          'Tài khoản này chưa đăng ký khóa Passkey. Vui lòng đăng nhập bằng mật khẩu hoặc Google trước.',
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
   * Step 4: Verify authentication and mint Supabase JWT
   */
  static async verifyLogin(response: AuthenticationResponseJSON) {
    const { expectedOrigins, rpID } = getWebAuthnConfig();

    const { data: cred } = await serverSupabase
      .from('webauthn_credentials')
      .select('*')
      .eq('credential_id', response.id)
      .maybeSingle();

    if (!cred) {
      throw new Error('Khóa bảo mật không tồn tại hoặc đã bị thu hồi.');
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
      throw new Error('Phiên xác thực đã hết hạn. Vui lòng thử lại.');
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
      throw new Error('Xác thực chữ ký Passkey không hợp lệ.');
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
