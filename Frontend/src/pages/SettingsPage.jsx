import { Lock, Moon, Server, Sun, UserCircle2 } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import { env } from '../config/env';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

export default function SettingsPage() {
  const { session } = useAuth();
  const { t, theme, toggleTheme } = usePreferences();

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="card p-6">
        <UserCircle2 className="h-7 w-7 text-cyan-500" />
        <h3 className="mt-3 text-xl font-semibold text-primary">{t('common.profile')}</h3>
        <div className="mt-5 space-y-3">
          {[
            [t('common.name'), session?.name],
            [t('common.email'), session?.email],
            [t('common.role'), session?.role],
            [t('common.assignedPharmacy'), session?.pharmacyName || t('common.all')],
          ].map(([label, value]) => (
            <div className="flex justify-between border-b border-soft pb-3" key={label}>
              <span className="text-sm text-muted">{label}</span>
              <span className="font-medium text-primary">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <Sun className="h-7 w-7 text-cyan-500" />
        <h3 className="mt-3 text-xl font-semibold text-primary">{t('common.appearance')}</h3>
        <div className="mt-5 grid gap-3">
          <button className="btn-secondary justify-between" onClick={toggleTheme} type="button">
            <span>{t('common.theme')}: {theme}</span>
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-soft p-3">
            <span className="text-sm font-semibold text-primary">{t('app.language')}</span>
            <LanguageToggle />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <Server className="h-7 w-7 text-cyan-500" />
        <h3 className="mt-3 text-xl font-semibold text-primary">{t('common.system')}</h3>
        <div className="mt-5 space-y-3">
          {[
            [t('common.apiUrl'), env.apiBaseUrl],
            [t('common.provider'), env.aiProvider],
            ['Gemini Model', env.geminiModel],
            [t('common.uploadLimit'), `${env.maxUploadSizeMb} MB`],
            [t('app.appVersion'), env.appVersion],
          ].map(([label, value]) => (
            <div className="flex justify-between gap-4 border-b border-soft pb-3" key={label}>
              <span className="text-sm text-muted">{label}</span>
              <span className="max-w-xs truncate font-medium text-primary">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <Lock className="h-7 w-7 text-cyan-500" />
        <h3 className="mt-3 text-xl font-semibold text-primary">{t('common.security')}</h3>
        <div className="mt-5 space-y-3">
          <div className="sub-card p-4">
            <p className="font-medium text-primary">Change password</p>
            <p className="mt-2 text-sm text-muted">Placeholder for future password update workflow.</p>
          </div>
          <div className="sub-card p-4">
            <p className="font-medium text-primary">Session Status</p>
            <p className="mt-2 text-sm text-muted">Active session · {session?.demoMode ? t('app.demoMode') : 'API token session'}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
