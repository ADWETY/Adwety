export const ROLE_GROUPS = {
  super: ['admin'],
  admin: ['admin'],
  support: ['admin'],
  scanner: ['admin', 'pharmacist', 'patient'],
  dashboard: ['admin'],
  medicine: ['admin'],
  notifications: ['admin', 'pharmacist', 'patient'],
  settings: ['admin', 'pharmacist', 'patient'],
};

export function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (!value) return '';
  if (['owner', 'super_admin', 'support_admin', 'dashboard_admin', 'admin_user'].includes(value)) return 'admin';
  if (['pharmacy_admin', 'pharmacy_owner'].includes(value)) return 'pharmacist';
  if (['user', 'customer', 'client'].includes(value)) return 'patient';
  return value;
}

export function hasRole(role, allowedRoles = []) {
  if (!allowedRoles?.length) return true;
  const normalized = normalizeRole(role);
  return allowedRoles.map(normalizeRole).includes(normalized);
}
