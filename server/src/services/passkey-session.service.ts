import { serverSupabase } from '../db/supabase.js';
import { mintSupabaseJwt } from '../utils/jwt.js';

/**
 * Builds the client-facing passkey session envelope.
 *
 * Extracted from the authentication service because both the login flow and the
 * refresh flow need it, and the refresh flow knows only a user id — it has no
 * credential row to hand.
 */

/** Access-token lifetime, in seconds. Kept at 7 days to match the previous flow. */
export const PASSKEY_ACCESS_TOKEN_TTL_SECONDS = 604800;

export interface PasskeySessionUser {
  id: string;
  email?: string;
  role: string;
  app_metadata: { provider: 'passkey' };
  user_metadata: { employee_id?: string; full_name?: string };
}

export interface PasskeySession {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: PasskeySessionUser;
}

export class PasskeySessionService {
  /**
   * Resolve profile, GoTrue user and employee code, then mint an access token.
   * `credentialId` only supplies the employee id; the token's identity comes
   * from `userId`, which callers must have proven.
   */
  static async buildSession(
    userId: string,
    credentialId?: string,
  ): Promise<PasskeySession> {
    const { data: profile } = await serverSupabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .maybeSingle();

    const { data: authUser } =
      await serverSupabase.auth.admin.getUserById(userId);

    let employeeId: string | undefined;
    if (credentialId) {
      const { data: cred } = await serverSupabase
        .from('webauthn_credentials')
        .select('employee_id')
        .eq('credential_id', credentialId)
        .maybeSingle();
      employeeId = cred?.employee_id ?? undefined;
    }

    const role = profile?.role || 'authenticated';
    const fullName = profile?.full_name ?? undefined;

    const accessToken = await mintSupabaseJwt({
      userId,
      email: authUser?.user?.email,
      role,
      employeeId,
      fullName,
    });

    return {
      access_token: accessToken,
      token_type: 'bearer',
      expires_in: PASSKEY_ACCESS_TOKEN_TTL_SECONDS,
      user: {
        id: userId,
        email: authUser?.user?.email,
        role,
        app_metadata: { provider: 'passkey' },
        user_metadata: { employee_id: employeeId, full_name: fullName },
      },
    };
  }
}
