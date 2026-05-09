export const ROLE_GROUPS = {
  super: ['owner', 'super_admin', 'admin'],
  admin: ['owner', 'super_admin', 'admin', 'pharmacy_admin'],
  support: ['owner', 'super_admin', 'admin', 'support_admin'],
  scanner: ['owner', 'super_admin', 'admin', 'pharmacy_admin', 'user', 'patient'],
  dashboard: ['owner', 'super_admin', 'admin', 'pharmacy_admin', 'support_admin'],
  medicine: ['owner', 'super_admin', 'admin', 'pharmacy_admin', 'user', 'patient'],
  notifications: ['owner', 'super_admin', 'admin', 'pharmacy_admin', 'support_admin', 'user', 'patient'],
  settings: ['owner', 'super_admin', 'admin', 'pharmacy_admin', 'support_admin', 'user', 'patient'],
};

export function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (!value) return '';
  if (['patient', 'customer', 'client'].includes(value)) return 'user';
  if (['dashboard_admin', 'admin_user'].includes(value)) return 'admin';
  return value;
}

export function hasRole(role, allowedRoles = []) {
  if (!allowedRoles?.length) return true;
  const normalized = normalizeRole(role);
  return allowedRoles.map(normalizeRole).includes(normalized);
}
