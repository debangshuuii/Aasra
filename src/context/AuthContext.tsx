import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';

export interface UserProfile {
  id: string;
  email?: string;
  display_name?: string;
  consent_accepted?: boolean;
  pin_configured?: boolean;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Extracts the best display name from a Supabase user object.
 * Priority: Google full_name > Google name > email prefix
 */
function extractDisplayName(user: User | null): string | null {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return (
    meta.full_name ||
    meta.name ||
    user.email?.split('@')[0] ||
    'User'
  );
}

/**
 * Extracts the Google profile avatar URL from a Supabase user object.
 */
function extractAvatarUrl(user: User | null): string | null {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return meta.avatar_url || meta.picture || null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const upsertProfile = async (u: User) => {
    try {
      const name =
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        u.email?.split('@')[0] ||
        'Anonymous User';

      const { error } = await supabase.from('profiles').upsert(
        {
          id: u.id,
          email: u.email,
          display_name: name,
        },
        { onConflict: 'id', ignoreDuplicates: false }
      );
      if (error) {
        console.warn('[AuthContext] Profile upsert error:', error.message);
      }
    } catch (err) {
      console.warn('[AuthContext] Profile upsert exception:', err);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('[AuthContext] Error fetching profile:', error.message);
      } else if (data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.warn('[AuthContext] Profile fetch error:', err);
    }
  };

  const handleUserSession = async (u: User | null, s: Session | null) => {
    setUser(u);
    setSession(s);
    setDisplayName(extractDisplayName(u));
    setAvatarUrl(extractAvatarUrl(u));

    if (u) {
      await upsertProfile(u);
      await fetchProfile(u.id);
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    // Track whether we're waiting for the hash-based implicit flow
    let waitingForHashSession = false;

    const init = async () => {
      // Check for OAuth error in URL query or hash
      const params = new URLSearchParams(window.location.search);
      const urlError = params.get('error') || params.get('error_description');
      if (urlError) {
        console.error('[AuthContext] OAuth error in URL:', urlError, params.get('error_description'));
      }

      // --- PKCE flow: ?code=... in query params ---
      const code = params.get('code');
      if (code) {
        try {
          let { data, error } = await supabase.auth.exchangeCodeForSession(code);
          // Handle device clock skew (token issued in future error) by retrying after 2.5s
          if (error && (error.message?.includes('future') || error.message?.includes('skew') || error.status === 401)) {
            console.warn('[AuthContext] Clock skew detected, retrying code exchange in 2.5s...');
            await new Promise((r) => setTimeout(r, 2500));
            const retryRes = await supabase.auth.exchangeCodeForSession(code);
            data = retryRes.data;
            error = retryRes.error;
          }

          if (!error && data.session && mounted) {
            window.history.replaceState({}, document.title, window.location.pathname);
            await handleUserSession(data.session.user, data.session);
            setLoading(false);
            return;
          } else if (error) {
            console.warn('[AuthContext] PKCE exchange error:', error.message);
          }
        } catch (err) {
          console.warn('[AuthContext] PKCE code exchange failed:', err);
        }
      }

      // --- Implicit flow: Supabase redirected back with #access_token=... ---
      if (window.location.hash.includes('access_token=')) {
        waitingForHashSession = true;
        // Schedule a 3s clock-skew retry in case gotrue-js initially rejected a token issued seconds in future
        setTimeout(async () => {
          if (!mounted) return;
          const { data: { session: hashSession } } = await supabase.auth.getSession();
          if (hashSession) {
            window.history.replaceState({}, document.title, window.location.pathname);
            await handleUserSession(hashSession.user, hashSession);
          }
          setLoading(false);
        }, 3000);
        return;
      }

      // --- Normal page load: restore existing session ---
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (!mounted) return;
      await handleUserSession(existingSession?.user ?? null, existingSession ?? null);
      setLoading(false);
    };

    // Register onAuthStateChange FIRST so it's ready before init() runs
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        await handleUserSession(newSession?.user ?? null, newSession ?? null);
        setLoading(false);

        // Clean the hash from the URL AFTER Supabase has processed it
        if (window.location.hash.includes('access_token=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    );

    init();

    // Safety net: if we were waiting for hash auth and it never arrived
    // (e.g. Supabase failed to parse), stop loading after 5 seconds
    const safetyTimeout = waitingForHashSession
      ? setTimeout(() => {
          if (mounted) setLoading(false);
        }, 5000)
      : undefined;

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (safetyTimeout) clearTimeout(safetyTimeout);
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error };
    } catch (err: any) {
      return { error: err as AuthError };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      const redirectUrl = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      return { error };
    } catch (err: any) {
      return { error: err as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setDisplayName(null);
    setAvatarUrl(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        displayName,
        avatarUrl,
        signInWithGoogle,
        signInWithMagicLink,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
