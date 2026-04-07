/* eslint-disable react-refresh/only-export-components */
import type { Session, User, AuthError } from '@supabase/supabase-js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import { supabase } from '@/services/supabase/client'
import type { Profile } from '@/services/supabase/database.types'
import { getTenantId, resetTenantCache } from '@/services/supabase/tenant'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  /** true khi profile tồn tại nhưng is_active = false */
  isBlocked: boolean
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ data: { user: User | null; session: Session | null }; error: AuthError | null }>
  signOut: () => Promise<void>
}

export type AuthContextValue = AuthState & AuthActions

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error && data) {
      setProfile(data as Profile)
      // Pre-load tenant_id cache for withTenantId() helper
      getTenantId().catch(() => { /* silent — tenant table may not exist yet */ })
    } else {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        fetchProfile(s.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }, [])

  const signOut = useCallback(async () => {
    resetTenantCache()
    await supabase.auth.signOut()
  }, [])

  const isBlocked = profile !== null && !profile.is_active

  const value = useMemo<AuthContextValue>(
    () => ({ session, user, profile, loading, isBlocked, signIn, signUp, signOut }),
    [session, user, profile, loading, isBlocked, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải dùng bên trong <AuthProvider>')
  return ctx
}
