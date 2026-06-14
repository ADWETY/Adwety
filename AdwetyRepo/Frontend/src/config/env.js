export const env = {
  isProduction: import.meta.env.PROD,
  appName: import.meta.env.VITE_APP_NAME || 'ADWETY Dashboard',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500/api/v1',
  csrfCookieName: import.meta.env.VITE_CSRF_COOKIE_NAME || 'adwety_csrf',
  port: Number(import.meta.env.VITE_PORT || 6501),
  maxUploadSizeMb: Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || 10),
  appVersion: import.meta.env.VITE_APP_VERSION || '2.5.0-cookie-security',
};
