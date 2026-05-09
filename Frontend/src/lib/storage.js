const SESSION_KEY = 'adwety_dashboard_session';
const LEGACY_SESSION_KEY = 'adwety_dashboard_session';

// Primary token key used by the dashboard after this fix.
const TOKEN_KEY = 'adwety_auth_token';

// Legacy/manual keys kept for compatibility with previous tests and browser console checks.
const LEGACY_TOKEN_KEYS = ['token', 'adminToken', 'authToken'];

function getSessionStore() {
  return window.sessionStorage;
}

function sanitizeSessionMarker(session) {
  if (!session || typeof session !== 'object') return null;
  return { authenticated: Boolean(session.authenticated ?? true) };
}

export function getStoredSession() {
  try {
    let raw = getSessionStore().getItem(SESSION_KEY);
    if (!raw) {
      raw = window.localStorage.getItem(LEGACY_SESSION_KEY);
      if (raw) window.localStorage.removeItem(LEGACY_SESSION_KEY);
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return sanitizeSessionMarker(parsed);
  } catch (_error) {
    clearStoredSession();
    return null;
  }
}

export function setStoredSession(session = {}) {
  const marker = sanitizeSessionMarker(session);
  if (!marker) return;
  getSessionStore().setItem(SESSION_KEY, JSON.stringify(marker));
}

export function clearStoredSession() {
  try { window.sessionStorage.removeItem(SESSION_KEY); } catch (_error) {}
  try { window.localStorage.removeItem(LEGACY_SESSION_KEY); } catch (_error) {}
}

export function setStoredToken(token) {
  if (!token || typeof token !== 'string') return;
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  if (!cleanToken) return;

  try { window.localStorage.setItem(TOKEN_KEY, cleanToken); } catch (_error) {}

  // Keep these keys because some existing code/tests may still look for them.
  for (const key of LEGACY_TOKEN_KEYS) {
    try { window.localStorage.setItem(key, cleanToken); } catch (_error) {}
  }
}

export function getStoredToken() {
  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) return token.replace(/^Bearer\s+/i, '').trim();
  } catch (_error) {}

  for (const key of LEGACY_TOKEN_KEYS) {
    try {
      const token = window.localStorage.getItem(key);
      if (token) return token.replace(/^Bearer\s+/i, '').trim();
    } catch (_error) {}
  }

  return '';
}

export function clearStoredToken() {
  try { window.localStorage.removeItem(TOKEN_KEY); } catch (_error) {}
  for (const key of LEGACY_TOKEN_KEYS) {
    try { window.localStorage.removeItem(key); } catch (_error) {}
  }
}

export function clearAuthStorage() {
  clearStoredSession();
  clearStoredToken();
}
