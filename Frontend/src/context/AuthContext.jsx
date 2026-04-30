import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { env } from '../config/env';
import { postJson } from '../lib/api';
import { clearStoredSession, getStoredSession, setStoredSession } from '../lib/storage';

const AuthContext = createContext(null);

function inferFallbackRole(email, preferredRole) {
  if (preferredRole) return preferredRole;
  if (email === env.demoUsers.owner?.email) return 'owner';
  if (email === env.demoUsers.super_admin.email) return 'super_admin';
  if (email === env.demoUsers.pharmacy_admin.email) return 'pharmacy_admin';
  if (email === env.demoUsers.support_admin.email) return 'support_admin';
  return 'user';
}

function buildSession(payload, fallback = {}) {
  const role = payload.role || inferFallbackRole(fallback.email, fallback.role);
  return {
    id: payload.id || `${role || 'user'}-${Date.now()}`,
    email: payload.email || fallback.email,
    name: payload.name || fallback.email,
    role,
    accountType: payload.account_type || (role === 'user' ? 'user' : 'admin'),
    approvalStatus: payload.approval_status || (role === 'user' ? 'approved' : 'pending'),
    pendingApproval: Boolean(payload.pending_approval),
    pharmacyName: role === 'pharmacy_admin' ? env.demoUsers.pharmacy_admin.pharmacyName : null,
    demoMode: !payload.token,
    token: payload.token || null,
    emailVerified: Boolean(payload.email_verified),
    phoneVerified: Boolean(payload.phone_verified),
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    setIsBooting(false);
  }, []);

  const value = useMemo(() => ({
    session,
    isAuthenticated: Boolean(session),
    isBooting,
    async login({ email, password, role }) {
      try {
        const result = await postJson('/auth/login', { email, password });
        const payload = result?.data || {};
        if (payload.requires_otp) {
          return { ...payload, email, role };
        }
        const nextSession = buildSession(payload, { email, role });
        setSession(nextSession);
        setStoredSession(nextSession);
        return nextSession;
      } catch (backendError) {
        if (!env.enableDemoAuth) throw backendError;

        const preset = env.demoUsers[role];
        if (!preset || !preset.password) throw backendError;
        if (email !== preset.email || password !== preset.password) throw backendError;

        const nextSession = buildSession({
          email: preset.email,
          name: preset.name,
          role,
          token: null,
          approval_status: 'approved',
        }, { email: preset.email, role });
        setSession(nextSession);
        setStoredSession(nextSession);
        return nextSession;
      }
    },
    async verifyLoginOtp({ otpToken, otp, email, role }) {
      const result = await postJson('/auth/login/verify-otp', { otp_token: otpToken, otp });
      const payload = result?.data || {};
      const nextSession = buildSession(payload, { email, role });
      setSession(nextSession);
      setStoredSession(nextSession);
      return nextSession;
    },
    async register({ fullName, email, password, phoneNumber, role = 'user', pharmacy = null }) {
      const isAdmin = role && role !== 'user';
      const result = await postJson('/auth/register', {
        full_name: fullName,
        email,
        password,
        phone_number: phoneNumber,
        account_type: isAdmin ? 'admin' : 'user',
        role,
        pharmacy,
      });
      const payload = result?.data || {};
      if (payload.requires_otp || payload.pending_approval) return { ...payload, email, role };
      const nextSession = buildSession(payload, { email, role });
      setSession(nextSession);
      setStoredSession(nextSession);
      return nextSession;
    },
    async verifyRegisterOtp({ otpToken, otp, email, role }) {
      const result = await postJson('/auth/register/verify-otp', { otp_token: otpToken, otp });
      const payload = result?.data || {};
      if (payload.pending_approval || !payload.token) return { ...payload, email, role };
      const nextSession = buildSession(payload, { email, role });
      setSession(nextSession);
      setStoredSession(nextSession);
      return nextSession;
    },
    async requestPasswordReset({ email }) {
      const result = await postJson('/auth/forgot-password', { email });
      return result?.data || {};
    },
    async resetPassword({ otpToken, otp, newPassword }) {
      const result = await postJson('/auth/reset-password', {
        otp_token: otpToken,
        otp,
        new_password: newPassword,
      });
      return result?.data || {};
    },
    logout() {
      setSession(null);
      clearStoredSession();
    },
  }), [session, isBooting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
