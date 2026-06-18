import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isWebStaffRole, normalizeRole } from '../lib/roles';
import { getJson, postJson } from '../lib/api';
import {
  clearAuthStorage,
  clearStoredSession,
  getStoredSession,
  purgeLegacyTokenStorage,
  setStoredSession,
} from '../lib/storage';

const AuthContext = createContext(null);

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
    requires_otp: false,
    mfa_required: false,
    mfa_setup_required: false,
    mfa_policy_version: Number(data.mfa_policy_version ?? data.mfaPolicyVersion ?? user.mfa_policy_version ?? user.mfaPolicyVersion ?? 1),
    mfa_grandfathered: Boolean(data.mfa_grandfathered ?? data.mfaGrandfathered ?? user.mfa_grandfathered ?? user.mfaGrandfathered),
    otp_token: null,
    challenge_id: null,
    expires_in_minutes: data.expires_in_minutes || (data.expires_in ? Math.max(1, Math.ceil(Number(data.expires_in) / 60)) : null),
    setup_secret: null,
    provisioning_uri: null,
    password_policy_version: Number(data.password_policy_version ?? data.passwordPolicyVersion ?? user.password_policy_version ?? user.passwordPolicyVersion ?? 1),
    password_upgrade_recommended: Boolean(data.password_upgrade_recommended ?? data.passwordUpgradeRecommended ?? user.password_upgrade_recommended ?? user.passwordUpgradeRecommended),
  };
}

function buildSession(payload, fallback = {}) {
  const role = normalizeRole(payload.role || fallback.role);
  if (!role) throw new Error('The server response does not contain a valid user role.');

  const accountType = payload.account_type || payload.accountType || (role === 'patient' ? 'user' : 'admin');
  return {
    id: payload.id || payload._id || '',
    email: payload.email || fallback.email || '',
    name: payload.name || payload.fullName || payload.full_name || fallback.email || 'ADWETY User',
    role,
    accountType,
    pharmacyName: role === 'pharmacist' ? (payload.pharmacy_name || payload.pharmacyName || fallback.pharmacyName || '') : null,
    demoMode: false,
    emailVerified: Boolean(payload.email_verified ?? payload.emailVerified),
    phoneNumber: payload.phone_number || payload.phoneNumber || fallback.phoneNumber || '',
    phoneVerified: Boolean(payload.phone_verified ?? payload.phoneVerified),
    passwordPolicyVersion: Number(payload.password_policy_version ?? payload.passwordPolicyVersion ?? fallback.passwordPolicyVersion ?? 1),
    passwordUpgradeRecommended: Boolean(payload.password_upgrade_recommended ?? payload.passwordUpgradeRecommended ?? fallback.passwordUpgradeRecommended),
    mfaPolicyVersion: Number(payload.mfa_policy_version ?? payload.mfaPolicyVersion ?? fallback.mfaPolicyVersion ?? 1),
    mfaGrandfathered: Boolean(payload.mfa_grandfathered ?? payload.mfaGrandfathered ?? fallback.mfaGrandfathered),
  };
}

function persistAuthenticatedSession() {
  purgeLegacyTokenStorage();
  setStoredSession({ authenticated: true });
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const expire = () => {
      setSession(null);
      clearAuthStorage();
    };
    window.addEventListener('adwety:auth-expired', expire);
    return () => window.removeEventListener('adwety:auth-expired', expire);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      purgeLegacyTokenStorage();
      // The HttpOnly cookies cannot be read by JavaScript. The server is the
      // source of truth, so we safely ask /auth/me on every fresh app load.
      getStoredSession();
      try {
        const result = await getJson('/profile/me');
        if (cancelled) return;

        const profile = normalizeAuthPayload(result);
        const nextSession = buildSession(profile, {
          email: profile.email,
          role: profile.role,
        });

        if (!isWebStaffRole(nextSession.role)) {
          try { await postJson('/auth/logout', {}); } catch (_error) {}
          setSession(null);
          clearAuthStorage();
          clearStoredSession();
          return;
        }

        setSession(nextSession);
        persistAuthenticatedSession();
      } catch (_error) {
        try { await postJson('/auth/logout', {}); } catch (_logoutError) {}
        if (!cancelled) {
          setSession(null);
          clearAuthStorage();
          clearStoredSession();
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
      const result = await postJson('/auth/login', { email, password });
      const payload = normalizeAuthPayload(result);

      const nextSession = buildSession(payload, { email });
      if (!isWebStaffRole(nextSession.role)) {
        try { await postJson('/auth/logout', {}); } catch (_error) {}
        clearAuthStorage();
        clearStoredSession();
        throw new Error('Web dashboard access is limited to administrators and pharmacists.');
      }
      setSession(nextSession);
      persistAuthenticatedSession();
      return nextSession;
    },
    async requestPasswordReset({ email }) {
      const result = await postJson('/auth/forgot-password', { email: String(email || '').trim().toLowerCase() });
      const payload = result?.data || {};
      const requestId = payload.request_id || payload.requestId || payload.otp_token || '';
      return {
        ...payload,
        request_id: requestId,
        requestId,
        otp_token: requestId,
      };
    },
    async resetPassword({ email, otpToken, requestId, otp, newPassword }) {
      const resetRequestId = otpToken || requestId;
      const body = {
        otp,
        new_password: newPassword,
        newPassword,
      };
      if (email) body.email = String(email).trim().toLowerCase();
      if (resetRequestId) {
        body.request_id = resetRequestId;
        body.otp_token = resetRequestId;
      } else {
        throw new Error('OTP request id is required to reset your password.');
      }
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
        passwordPolicyVersion: Number(profile.password_policy_version ?? profile.passwordPolicyVersion ?? session.passwordPolicyVersion ?? 1),
        passwordUpgradeRecommended: Boolean(profile.password_upgrade_recommended ?? profile.passwordUpgradeRecommended ?? session.passwordUpgradeRecommended),
        mfaPolicyVersion: Number(profile.mfa_policy_version ?? profile.mfaPolicyVersion ?? session.mfaPolicyVersion ?? 1),
        mfaGrandfathered: Boolean(profile.mfa_grandfathered ?? profile.mfaGrandfathered ?? session.mfaGrandfathered),
      };
      setSession(nextSession);
      persistAuthenticatedSession();
      return nextSession;
    },
    async logout() {
      try { await postJson('/auth/logout', {}); } catch (_error) {}
      setSession(null);
      clearAuthStorage();
      clearStoredSession();
    },
  }), [session, isBooting]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
