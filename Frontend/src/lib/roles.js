export const ROLE_GROUPS = {
  web: ['admin', 'pharmacist'],
  super: ['admin'],
  admin: ['admin'],
  support: ['admin'],
  retail: ['admin', 'pharmacist'],
  dashboard: ['admin'],
  medicine: ['admin'],
  notifications: ['admin', 'pharmacist'],
  settings: ['admin', 'pharmacist'],
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

export function isWebStaffRole(role) {
  return hasRole(role, ROLE_GROUPS.web);
}
