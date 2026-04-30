import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordPage() {
  const { requestPasswordReset, resetPassword } = useAuth();
  const { t } = usePreferences();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [otpState, setOtpState] = useState(null);
  const [otp, setOtp] = useState('');
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onRequestOtp(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');
    try {
      await requestPasswordReset({ email });
      setOtpState({ email, expires_in_minutes: 10 });
      setMessage(t('otp.ifExists'));
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onReset(event) {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError(t('forms.passwordsMismatch'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await resetPassword({ email: otpState.email, otpToken: otpState.otp_token, otp, newPassword: passwords.newPassword });
      setMessage(t('otp.passwordResetDone'));
      toast.success(t('otp.passwordResetDone'));
      setOtpState(null);
      setOtp('');
      setPasswords({ newPassword: '', confirmPassword: '' });
    } catch (submitError) {
      setError(submitError.message);
      toast.error(t('toast.failed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="card w-full max-w-xl p-8">
        <h1 className="text-3xl font-semibold text-primary">{otpState ? t('otp.resetPassword') : t('actions.forgotPassword')}</h1>
        <p className="mt-2 text-sm text-muted">{t('otp.forgotLead')}</p>

        {otpState ? (
          <form className="mt-8 space-y-5" onSubmit={onReset}>
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100">
              {t('otp.sentTo')} {otpState.email}. {t('otp.expiresIn')} {otpState.expires_in_minutes} {t('otp.minutes')}.
            </div>
            <div>
              <label className="label">{t('otp.code')}</label>
              <div className="relative">
                <ShieldCheck className="absolute start-4 top-3.5 h-4 w-4 text-soft" />
                <input className="input ps-11 tracking-[0.35em]" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="000000" />
              </div>
            </div>
            <div>
              <label className="label">{t('otp.newPassword')}</label>
              <input className="input" type="password" value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} />
            </div>
            <div>
              <label className="label">{t('common.confirmPassword')}</label>
              <input className="input" type="password" value={passwords.confirmPassword} onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))} />
            </div>
            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</div> : null}
            <div className="flex items-center justify-between gap-3">
              <Link to="/login" className="text-sm text-muted hover:text-cyan-600">{t('actions.backToLogin')}</Link>
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? t('app.loading') : t('otp.resetPassword')}</button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={onRequestOtp}>
            <div>
              <label className="label">{t('common.email')}</label>
              <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
            </div>
            {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">{message}</div> : null}
            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</div> : null}
            <div className="flex items-center justify-between gap-3">
              <Link to="/login" className="text-sm text-muted hover:text-cyan-600">{t('actions.backToLogin')}</Link>
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? t('app.loading') : t('otp.sendCode')}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
