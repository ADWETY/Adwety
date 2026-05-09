import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { env } from '../config/env';
import { normalizeRole } from '../lib/roles';
import { getJson, postJson } from '../lib/api';
import {
  clearAuthStorage,
  clearStoredSession,
  getStoredSession,
  getStoredToken,
  setStoredSession,
  setStoredToken,
} from '../lib/storage';

const AuthContext = createContext(null);

function inferFallbackRole(email, preferredRole) {
  if (preferredRole) return normalizeRole(preferredRole);
  if (email === env.demoUsers.super_admin.email) return 'super_admin';
  if (email === env.demoUsers.pharmacy_admin.email) return 'pharmacy_admin';
  if (email === env.demoUsers.support_admin.email) return 'support_admin';
  return 'user';
}

function normalizeAuthPayload(result) {
  const data = result?.data || result || {};
  const user = data.user || {};

  return {
    ...user,
    ...data,
    id: data.id || data._id || user.id || user._id,
    email: data.email || user.email,
    name: data.name || data.fullName || data.full_name || user.name || user.fullName || user.full_name,
    role: data.role || user.role,
    account_type: data.account_type || data.accountType || user.account_type || user.accountType,
    pharmacy_name: data.pharmacy_name || data.pharmacyName || user.pharmacy_name || user.pharmacyName,
    phone_number: data.phone_number || data.phoneNumber || user.phone_number || user.phoneNumber,
    email_verified: data.email_verified ?? data.emailVerified ?? user.email_verified ?? user.emailVerified,
    phone_verified: data.phone_verified ?? data.phoneVerified ?? user.phone_verified ?? user.phoneVerified,
    token: data.token || data.accessToken || data.access_token || result?.token || getStoredToken() || null,
  };
}

function buildSession(payload, fallback = {}) {
  const role = normalizeRole(payload.role || fallback.role || inferFallbackRole(payload.email || fallback.email, fallback.role));
  const demoMode = Boolean(payload.demo_mode || fallback.demoMode);

  if (!role && !demoMode) {
    throw new Error('Invalid session payload from server.');
  }

  const accountType = payload.account_type || payload.accountType || (role === 'user' ? 'user' : 'admin');

  return {
    id: payload.id || payload._id || (demoMode ? 'demo-user' : ''),
    email: payload.email || fallback.email || '',
    name: payload.name || payload.fullName || payload.full_name || fallback.email || 'ADWETY User',
    role: role || 'user',
    accountType,
    pharmacyName: role === 'pharmacy_admin' ? (payload.pharmacy_name || payload.pharmacyName || fallback.pharmacyName || '') : null,
    demoMode,
    token: payload.token || fallback.token || getStoredToken() || null,
    emailVerified: Boolean(payload.email_verified ?? payload.emailVerified),
    phoneNumber: payload.phone_number || payload.phoneNumber || fallback.phoneNumber || '',
    phoneVerified: Boolean(payload.phone_verified ?? payload.phoneVerified),
  };
}

function persistAuthenticatedSession(session) {
  if (session?.token) setStoredToken(session.token);
  setStoredSession({ authenticated: true });
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      try {
        const marker = getStoredSession();
        const token = getStoredToken();
        if (!marker && !token) return;

        const result = await getJson('/profile/me');
        if (cancelled) return;

        const profile = normalizeAuthPayload(result);
        const nextSession = buildSession(profile, {
          email: profile.email,
          role: profile.role,
          token,
        });

        setSession(nextSession);
        persistAuthenticatedSession(nextSession);
      } catch (_error) {
        if (!cancelled) {
          setSession(null);
          clearAuthStorage();
        }
      } finally {
        if (!cancelled) setIsBooting(false);
      }
    }

    hydrateSession();
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(() => ({
    session,
    isAuthenticated: Boolean(session),
    isBooting,
    async login({ email, password, role }) {
      try {
        const result = await postJson('/auth/login', { email, password });
        const payload = normalizeAuthPayload(result);

        if (payload.requires_otp) {
          return { ...payload, email, role };
        }

        const nextSession = buildSession(payload, { email, role, token: payload.token });
        setSession(nextSession);
        persistAuthenticatedSession(nextSession);
        return nextSession;
      } catch (backendError) {
        if (!env.enableDemoAuth || env.isProduction) throw backendError;

        const preset = env.demoUsers[role];
        if (!preset || !preset.password) throw backendError;
        if (email !== preset.email || password !== preset.password) throw backendError;

        const nextSession = buildSession({
          email: preset.email,
          name: preset.name,
          role,
          demo_mode: true,
          token: null,
        }, { email: preset.email, role, demoMode: true, pharmacyName: preset.pharmacyName });
        setSession(nextSession);
        setStoredSession({ authenticated: true });
        return nextSession;
      }
    },
    async verifyLoginOtp({ otpToken, otp, email, role }) {
      const result = await postJson('/auth/login/verify-otp', { otp_token: otpToken, otp });
      const payload = normalizeAuthPayload(result);
      const nextSession = buildSession(payload, { email, role, token: payload.token });
      setSession(nextSession);
      persistAuthenticatedSession(nextSession);
      return nextSession;
    },
    async register({ fullName, email, password, phoneNumber }) {
      const result = await postJson('/auth/register', {
        full_name: fullName,
        fullName,
        name: fullName,
        email,
        password,
        phone_number: phoneNumber,
        phoneNumber,
      });
      const payload = normalizeAuthPayload(result);
      if (payload.requires_otp || payload.queued) return { ...payload, email, role: 'user' };
      const nextSession = buildSession(payload, { email, role: 'user', token: payload.token });
      setSession(nextSession);
      persistAuthenticatedSession(nextSession);
      return nextSession;
    },
    async verifyRegisterOtp({ otpToken, otp, email }) {
      const result = await postJson('/auth/register/verify-otp', { otp_token: otpToken, otp });
      const payload = normalizeAuthPayload(result);
      const nextSession = buildSession(payload, { email, role: 'user', token: payload.token });
      setSession(nextSession);
      persistAuthenticatedSession(nextSession);
      return nextSession;
    },
    async requestPasswordReset({ email }) {
      const result = await postJson('/auth/forgot-password', { email });
      return result?.data || {};
    },
    async resetPassword({ email, otpToken, otp, newPassword }) {
      const body = {
        otp,
        new_password: newPassword,
        newPassword,
      };
      if (email) body.email = email;
      if (otpToken) body.otp_token = otpToken;
      else throw new Error('OTP token is required to reset your password.');
      const result = await postJson('/auth/reset-password', body);
      return result?.data || {};
    },
    updateSessionProfile(profile) {
      if (!profile || !session) return null;
      const nextSession = {
        ...session,
        email: profile.email || session.email,
        name: profile.name || profile.fullName || profile.full_name || session.name,
        role: normalizeRole(profile.role || session.role),
        accountType: profile.account_type || profile.accountType || session.accountType,
        phoneNumber: profile.phone_number || profile.phoneNumber || session.phoneNumber || '',
        emailVerified: Boolean(profile.email_verified ?? profile.emailVerified),
        phoneVerified: Boolean(profile.phone_verified ?? profile.phoneVerified),
      };
      setSession(nextSession);
      persistAuthenticatedSession(nextSession);
      return nextSession;
    },
    logout() {
      postJson('/auth/logout', {}).catch(() => {});
      setSession(null);
      clearAuthStorage();
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
