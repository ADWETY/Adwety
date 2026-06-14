import { useState } from 'react';
import { Lock, Moon, Server, Sun, UserCircle2 } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import { env } from '../config/env';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';
import { postJson } from '../lib/api';

export default function SettingsPage() {
  const { session } = useAuth();
  const { t, theme, toggleTheme } = usePreferences();
  const toast = useToast();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  async function changePassword(event) {
    event.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('forms.passwordsMismatch'));
      return;
    }
    setSavingPassword(true);
    try {
      await postJson('/profile/password', { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(t('toast.updated'));
    } catch (error) {
      setPasswordError(error.message || t('toast.failed'));
      toast.error(t('toast.failed'));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="card p-6">
        <UserCircle2 className="h-7 w-7 text-cyan-500" />
        <h3 className="mt-3 text-xl font-semibold text-primary">{t('common.profile')}</h3>
        <div className="mt-5 space-y-3">
          {[
            [t('common.name'), session?.name],
            [t('common.email'), session?.email],
            [t('common.role'), t(`roles.${session?.role}`, session?.role)],
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
            <span>{t('common.theme')}: {t(`common.${theme}`)}</span>
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
        <form className="mt-5 space-y-4" onSubmit={changePassword}>
          <div>
            <label className="label">{t('common.currentPassword')}</label>
            <input className="input" type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} />
          </div>
          <div>
            <label className="label">{t('common.newPassword')}</label>
            <input className="input" type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} />
          </div>
          <div>
            <label className="label">{t('common.confirmNewPassword')}</label>
            <input className="input" type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
          </div>
          {passwordError ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{passwordError}</p> : null}
          <button className="btn-primary" disabled={savingPassword}>{savingPassword ? t('app.loading') : t('actions.save')}</button>
        </form>
        <div className="mt-5 sub-card p-4">
          <p className="font-medium text-primary">{t('common.sessionStatus')}</p>
          <p className="mt-2 text-sm text-muted">{t('common.activeApiSession')}</p>
        </div>
      </section>
    </div>
  );
}
