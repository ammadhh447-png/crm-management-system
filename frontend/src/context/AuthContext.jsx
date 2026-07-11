import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  const syncPromiseRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

  const isRetryableAuthError = (message = '') => {
    const normalized = message.toLowerCase();
    return normalized.includes('too many')
      || normalized.includes('rate limit')
      || normalized.includes('network')
      || normalized.includes('timeout');
  };

  const buildProfilePayload = (supabaseUser) => ({
    firstName: supabaseUser.user_metadata?.first_name
      || supabaseUser.user_metadata?.full_name?.split(' ')[0]
      || supabaseUser.user_metadata?.name?.split(' ')[0]
      || 'User',
    lastName: supabaseUser.user_metadata?.last_name
      || supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ')
      || supabaseUser.user_metadata?.name?.split(' ').slice(1).join(' ')
      || '',
  });

  const syncUserProfile = useCallback(async (supabaseUser) => {
    if (!supabaseUser) return null;
    if (syncPromiseRef.current) return syncPromiseRef.current;

    const runSync = async () => {
      const maxAttempts = 4;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          const response = await authApi.syncSession();
          setUser(response.data);
          return response.data;
        } catch (err) {
          const message = err.message || '';
          const shouldRegister = message.toLowerCase().includes('not found')
            || message.toLowerCase().includes('registration');

          if (shouldRegister) {
            try {
              const response = await authApi.register(buildProfilePayload(supabaseUser));
              setUser(response.data);
              return response.data;
            } catch (registerErr) {
              if (isRetryableAuthError(registerErr.message) && attempt < maxAttempts - 1) {
                await wait(800 * (attempt + 1));
                continue;
              }
              setUser(null);
              return null;
            }
          }

          if (isRetryableAuthError(message) && attempt < maxAttempts - 1) {
            await wait(800 * (attempt + 1));
            continue;
          }

          setUser(null);
          return null;
        }
      }

      setUser(null);
      return null;
    };

    syncPromiseRef.current = runSync().finally(() => {
      syncPromiseRef.current = null;
    });

    return syncPromiseRef.current;
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);

      if (newSession?.user) {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          await syncUserProfile(newSession.user);
        } else if (event === 'TOKEN_REFRESHED' && !userRef.current) {
          await syncUserProfile(newSession.user);
        }
      } else {
        setUser(null);
      }

      if (!initialized.current) {
        initialized.current = true;
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [syncUserProfile]);

  const signUp = async (email, password, profileData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    if (data.session) {
      setSession(data.session);
      const response = await authApi.register(profileData);
      setUser(response.data);
    }

    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    setSession(data.session);
    const profile = await syncUserProfile(data.user);
    if (!profile) {
      throw new Error('Failed to create user profile. Please try again.');
    }
    return data;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    await authApi.passwordResetComplete();
  };

  const hasPermission = (permission) => {
    if (!user?.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (...roles) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  };

  const refreshProfile = useCallback(async () => {
    const response = await authApi.getMe();
    setUser(response.data);
    return response.data;
  }, []);

  const isGoogleUser = useMemo(() => {
    if (user?.authProvider === 'google') return true;

    const identities = session?.user?.identities || [];
    if (identities.some((identity) => identity.provider === 'google')) return true;
    return session?.user?.app_metadata?.provider === 'google';
  }, [user?.authProvider, session]);

  const displayUser = useMemo(() => {
    if (!user) return null;

    if (isGoogleUser) {
      const meta = session?.user?.user_metadata || {};
      const identity = (session?.user?.identities || []).find((item) => item.provider === 'google');
      const identityData = identity?.identity_data || {};
      const googleAvatar = meta.avatar_url || meta.picture || identityData.avatar_url || identityData.picture;

      if (googleAvatar) {
        return { ...user, avatar: googleAvatar, authProvider: 'google' };
      }
    }

    return user;
  }, [user, session, isGoogleUser]);

  const value = {
    user,
    displayUser,
    isGoogleUser,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    hasPermission,
    hasRole,
    refreshProfile,
    syncUserProfile,
    isAuthenticated: !!session && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
