export const env = {
  appName: import.meta.env.VITE_APP_NAME || 'ADWETY Dashboard',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500/api/v1',
  port: Number(import.meta.env.VITE_PORT || 6501),
  defaultRole: import.meta.env.VITE_DEFAULT_ROLE || 'super_admin',
  enableDemoAuth: String(import.meta.env.VITE_ENABLE_DEMO_AUTH || 'false') === 'true',
  maxUploadSizeMb: Number(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || 10),
  aiProvider: import.meta.env.VITE_AI_PROVIDER || 'gemini',
  geminiModel: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash',
  customAiLabel: import.meta.env.VITE_CUSTOM_AI_LABEL || 'Future Custom Model',
  enableAiScan: String(import.meta.env.VITE_ENABLE_AI_SCAN || 'true') === 'true',
  appVersion: import.meta.env.VITE_APP_VERSION || '2.1.0-otp-secure',
  demoUsers: {
    super_admin: {
      email: import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'admin@adwety.app',
      password: '',
      name: import.meta.env.VITE_SUPER_ADMIN_NAME || 'Super Admin',
    },
    pharmacy_admin: {
      email: import.meta.env.VITE_PHARMACY_ADMIN_EMAIL || 'pharmacy@adwety.app',
      password: '',
      name: import.meta.env.VITE_PHARMACY_ADMIN_NAME || 'BlueCare Manager',
      pharmacyName: import.meta.env.VITE_DEMO_PHARMACY_NAME || 'BlueCare Pharmacy',
    },
    support_admin: {
      email: import.meta.env.VITE_SUPPORT_ADMIN_EMAIL || 'support@adwety.app',
      password: '',
      name: import.meta.env.VITE_SUPPORT_ADMIN_NAME || 'Support Admin',
    },
    user: {
      email: import.meta.env.VITE_USER_EMAIL || 'mona@adwety.app',
      password: '',
      name: import.meta.env.VITE_USER_NAME || 'ADWETY User',
    },
  },
};
