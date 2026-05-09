import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const { register, verifyRegisterOtp } = useAuth();
  const { t, isRtl } = usePreferences();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phoneNumber: '', password: '', confirm: '' });
  const [otpState, setOtpState] = useState(null);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!form.name || !form.email || !form.password || form.password !== form.confirm) {
      setError(t('forms.checkRequired'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await register({ fullName: form.name, email: form.email, password: form.password, phoneNumber: form.phoneNumber });
      if (result?.requires_otp) {
        setOtpState(result);
        toast.success(t('otp.sent'));
        return;
      }
      toast.success(t('toast.saved'));
      navigate('/');
    } catch (err) {
      setError(err.message);
      toast.error(t('toast.failed'));
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyRegisterOtp({ otpToken: otpState.otp_token, otp, email: form.email });
      toast.success(t('otp.verified'));
      navigate('/');
    } catch (err) {
      setError(err.message);
      toast.error(t('toast.failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <div className="card w-full max-w-xl p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-200">ADWETY</p>
        <h1 className={`mt-4 text-3xl font-bold text-primary ${isRtl ? 'text-right' : ''}`}>{otpState ? t('otp.verifyAccount') : t('actions.register')}</h1>

        {otpState ? (
          <form className="mt-6 space-y-4" onSubmit={submitOtp}>
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100">
              {t('otp.sentTo')} {otpState.delivery?.destination || form.email}. {t('otp.expiresIn')} {otpState.expires_in_minutes} {t('otp.minutes')}.
            </div>
            <div>
              <label className="label">{t('otp.code')}</label>
              <div className="relative">
                <ShieldCheck className="absolute start-4 top-3.5 h-4 w-4 text-soft" />
                <input className="input ps-11 tracking-[0.35em]" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="000000" />
              </div>
            </div>
            {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</p> : null}
            <button className="btn-primary w-full" disabled={loading}>{loading ? t('app.loading') : t('otp.verify')}</button>
          </form>
        ) : (
          <form className="mt-6" onSubmit={submit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="label">{t('common.name')}</label><input className="input" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} /></div>
              <div><label className="label">{t('common.email')}</label><input className="input" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} /></div>
              <div className="md:col-span-2"><label className="label">{t('common.phone')}</label><input className="input" value={form.phoneNumber} onChange={(e) => setForm((c) => ({ ...c, phoneNumber: e.target.value }))} /></div>
              <div><label className="label">{t('common.password')}</label><input className="input" type="password" value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} /></div>
              <div><label className="label">{t('common.confirmPassword')}</label><input className="input" type="password" value={form.confirm} onChange={(e) => setForm((c) => ({ ...c, confirm: e.target.value }))} /></div>
            </div>
            <p className="mt-3 text-xs text-muted">{t('forms.passwordHint')}</p>
            {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</p> : null}
            <button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? t('app.loading') : t('actions.register')}</button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-muted"><Link className="font-semibold text-cyan-700 dark:text-cyan-200" to="/login">{t('actions.login')}</Link></p>
      </div>
    </main>
  );
}
