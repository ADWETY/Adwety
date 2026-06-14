import { useEffect, useState } from 'react';
import { Mail, Save, ShieldCheck } from 'lucide-react';
import { env } from '../config/env';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import RoleBadge from '../components/RoleBadge';
import { extractObject, getJson, patchJson, postJson } from '../lib/api';

export default function ProfilePage() {
  const { session, updateSessionProfile } = useAuth();
  const { t, theme, language } = usePreferences();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState({ fullName: '', phoneNumber: '' });
  const [emailForm, setEmailForm] = useState({ email: '', otp: '' });
  const [otpState, setOtpState] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const activeProfile = profile || session || {};

  useEffect(() => {
    async function load() {
      try {
        const result = await getJson('/profile');
        const data = extractObject(result, null);
        setProfile(data);
        updateSessionProfile(data);
        setEdit({ fullName: data?.name || '', phoneNumber: data?.phone_number || '' });
        setEmailForm((current) => ({ ...current, email: data?.email || '' }));
      } catch (loadError) {
        setError(loadError.message);
      }
    }
    load();
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await patchJson('/profile', {
        full_name: edit.fullName,
        phone_number: edit.phoneNumber,
      });
      setProfile(extractObject(result, null));
      updateSessionProfile(extractObject(result, null));
      setMessage(t('profile.saved'));
      toast.success(t('toast.saved'));
    } catch (saveError) {
      setError(saveError.message);
      toast.error(t('toast.failed'));
    } finally {
      setSaving(false);
    }
  }

  async function requestEmailOtp(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await postJson('/profile/email/request-otp', { email: emailForm.email });
      const otpInfo = extractObject(result, null);
      setOtpState(otpInfo);
      setMessage(otpInfo?.otp_code ? `${t('otp.sent')} · ${t('profile.devOtp')}: ${otpInfo.otp_code}` : t('otp.sent'));
      toast.success(t('otp.sent'));
    } catch (requestError) {
      setError(requestError.message);
      toast.error(t('toast.failed'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmEmailOtp(event) {
    event.preventDefault();
    if (!otpState) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await postJson('/profile/email/confirm-otp', {
        otp_token: otpState.otp_token,
        otp: emailForm.otp,
      });
      const data = extractObject(result, null);
      setProfile(data);
      updateSessionProfile(data);
      setEmailForm({ email: data?.email || '', otp: '' });
      setOtpState(null);
      setMessage(t('profile.emailUpdated'));
      toast.success(t('otp.verified'));
    } catch (confirmError) {
      setError(confirmError.message);
      toast.error(t('toast.failed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="card p-6">
        <h3 className="text-xl font-semibold text-primary">{t('common.activeDashboardSession')}</h3>
        <div className="mt-5 space-y-4">
          {[
            [t('common.name'), activeProfile.name],
            [t('common.email'), activeProfile.email],
            [t('common.phone'), activeProfile.phone_number || activeProfile.phoneNumber || '—'],
            [t('app.language'), language === 'ar' ? t('common.arabic') : t('common.english')],
            [t('common.theme'), t(`common.${theme}`)],
            [t('common.assignedPharmacy'), session?.pharmacyName || '—'],
          ].map(([label, value]) => (
            <div key={label} className="sub-card p-4">
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 break-all font-medium text-primary">{value || '—'}</p>
            </div>
          ))}
          <div className="sub-card p-4">
            <p className="text-sm text-muted">{t('app.role')}</p>
            <div className="mt-2"><RoleBadge role={activeProfile.role || session?.role} /></div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-primary">{t('common.editProfile')}</h3>
          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={saveProfile}>
            <div>
              <label className="label">{t('common.name')}</label>
              <input className="input" value={edit.fullName} onChange={(event) => setEdit((current) => ({ ...current, fullName: event.target.value }))} />
            </div>
            <div>
              <label className="label">{t('common.phone')}</label>
              <input className="input" value={edit.phoneNumber} onChange={(event) => setEdit((current) => ({ ...current, phoneNumber: event.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <button className="btn-primary gap-2" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? t('app.loading') : t('actions.save')}
              </button>
            </div>
          </form>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold text-primary">{t('common.changeEmailOtp')}</h3>
          {!otpState ? (
            <form className="mt-5 space-y-4" onSubmit={requestEmailOtp}>
              <div>
                <label className="label">{t('common.email')}</label>
                <div className="relative">
                  <Mail className="absolute start-4 top-3.5 h-4 w-4 text-soft" />
                  <input className="input ps-11" value={emailForm.email} onChange={(event) => setEmailForm((current) => ({ ...current, email: event.target.value }))} />
                </div>
              </div>
              <button className="btn-primary" disabled={saving}>{saving ? t('app.loading') : t('otp.sendCode')}</button>
            </form>
          ) : (
            <form className="mt-5 space-y-4" onSubmit={confirmEmailOtp}>
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100">
                {t('otp.sentTo')} {otpState.delivery?.destination || emailForm.email}. {t('otp.expiresIn')} {otpState.expires_in_minutes} {t('otp.minutes')}.
              </div>
              <div>
                <label className="label">{t('otp.code')}</label>
                <div className="relative">
                  <ShieldCheck className="absolute start-4 top-3.5 h-4 w-4 text-soft" />
                  <input className="input ps-11 tracking-[0.35em]" value={emailForm.otp} onChange={(event) => setEmailForm((current) => ({ ...current, otp: event.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="000000" />
                </div>
              </div>
              <button className="btn-primary" disabled={saving}>{saving ? t('app.loading') : t('otp.verify')}</button>
            </form>
          )}
          {message ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">{message}</p> : null}
          {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</p> : null}
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold text-primary">{t('common.systemConfiguration')}</h3>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              [t('common.frontendPort'), env.port],
              [t('common.apiBaseUrl'), env.apiBaseUrl],
              [t('common.uploadLimit'), `${env.maxUploadSizeMb} MB`],
            ].map(([label, value]) => (
              <div key={label} className="sub-card p-4">
                <p className="text-sm text-muted">{label}</p>
                <p className="mt-2 break-all font-medium text-primary">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold text-primary">{t('common.backendProfileEndpoint')}</h3>
          {error && !profile ? (
            <EmptyState title={t('common.profileEndpointError')} description={error} />
          ) : (
            <pre className="mt-4 overflow-auto rounded-3xl border border-soft bg-slate-50 p-4 text-sm text-primary dark:bg-slate-950/50">
{JSON.stringify(profile, null, 2)}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}
