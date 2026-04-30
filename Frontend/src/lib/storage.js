const SESSION_KEY = 'adwety_dashboard_session';
const LEGACY_SESSION_KEY = 'adwety_dashboard_session';
const VALID_ROLES = ['owner', 'super_admin', 'pharmacy_admin', 'support_admin', 'user'];

function getSessionStore() {
  return window.sessionStorage;
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
    if (!parsed || typeof parsed !== 'object' || !VALID_ROLES.includes(parsed.role)) {
      clearStoredSession();
      return null;
    }
    return parsed;
  } catch (_error) {
    clearStoredSession();
    return null;
  }
}

export function setStoredSession(session) {
  getSessionStore().setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  try { window.sessionStorage.removeItem(SESSION_KEY); } catch (_error) { /* ignore */ }
  try { window.localStorage.removeItem(LEGACY_SESSION_KEY); } catch (_error) { /* ignore */ }
}
