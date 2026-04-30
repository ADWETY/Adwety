import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Languages, Lock, Mail, Moon, ShieldCheck, Sun } from 'lucide-react';
import { env } from '../config/env';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login, verifyLoginOtp } = useAuth();
  const { t, theme, toggleTheme, language, setLanguage, isRtl } = usePreferences();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: env.demoUsers.owner.email, password: '', role: 'owner' });
  const [otpState, setOtpState] = useState(null);
  const [otp, setOtp] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(form);
      if (result?.requires_otp) {
        setOtpState(result);
        toast.success(t('otp.sent'));
        return;
      }
      toast.success(t('toast.demoReady'));
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
    if (!otpState) return;
    setLoading(true);
    setError('');
    try {
      await verifyLoginOtp({ otpToken: otpState.otp_token, otp, email: form.email, role: form.role });
      toast.success(t('toast.demoReady'));
      navigate('/');
    } catch (err) {
      setError(err.message);
      toast.error(t('toast.failed'));
    } finally {
      setLoading(false);
    }
  }

  function demo(role) {
    const user = env.demoUsers[role];
    setOtpState(null);
    setOtp('');
    setForm({ email: user.email, password: '', role });
  }

  const features = [
    t('login.featureInventory'),
    t('login.featurePharmacies'),
    t('login.featureAlerts'),
    t('login.featureAnalytics'),
    t('login.featureLanguages'),
  ];

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-soft bg-white shadow-soft dark:bg-slate-950 lg:grid-cols-[1fr_28rem]">
        <section className="hidden bg-cyan-600 p-10 text-white lg:block">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-100">ADWETY</p>
          <h1 className="mt-6 text-5xl font-bold">{t('login.title')}</h1>
          <p className="mt-5 text-cyan-50">{t('login.subtitle')}</p>
          <div className="mt-8 grid gap-3">
            {features.map((item) => <div key={item} className="rounded-2xl bg-white/10 p-4">{item}</div>)}
          </div>
        </section>

        <section className="p-6 md:p-10">
          <div className="mb-8 flex flex-wrap justify-between gap-2">
            <Link className="btn-secondary" to="/home">ADWETY</Link>
            <div className="flex gap-2">
              <button className="btn-secondary !p-3" onClick={toggleTheme} type="button">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <label className="btn-secondary !p-3">
                <Languages className="h-4 w-4" />
                <select className="bg-transparent outline-none" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="en">EN</option>
                  <option value="ar">AR</option>
                </select>
              </label>
            </div>
          </div>

          <h2 className={`text-3xl font-bold text-primary ${isRtl ? 'text-right' : ''}`}>{otpState ? t('otp.verifyTitle') : t('actions.login')}</h2>
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
              <button type="button" className="btn-secondary w-full" onClick={() => { setOtpState(null); setOtp(''); }}>{t('actions.back')}</button>
            </form>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div>
                <label className="label">{t('common.email')}</label>
                <div className="relative">
                  <Mail className="absolute start-4 top-3.5 h-4 w-4 text-soft" />
                  <input className="input ps-11" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">{t('common.password')}</label>
                <div className="relative">
                  <Lock className="absolute start-4 top-3.5 h-4 w-4 text-soft" />
                  <input className="input px-11" type={show ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} />
                  <button type="button" className="absolute end-3 top-2.5 rounded-xl p-2 text-soft" onClick={() => setShow((v) => !v)}>
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-sm text-muted">
                <label className="flex items-center gap-2"><input type="checkbox" />{t('actions.rememberMe')}</label>
                <Link className="font-semibold text-cyan-700 dark:text-cyan-200" to="/forgot-password">{t('actions.forgotPassword')}</Link>
              </div>
              {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</p> : null}
              <button className="btn-primary w-full" disabled={loading}>{loading ? t('app.loading') : t('actions.login')}</button>
            </form>
          )}

          {!otpState ? (
            <>
              <div className="mt-6 grid gap-2">
                <button className="btn-secondary" type="button" onClick={() => demo('owner')}>{t('actions.loginOwner')}</button>
                <button className="btn-secondary" type="button" onClick={() => demo('super_admin')}>{t('actions.loginSuper')}</button>
                <button className="btn-secondary" type="button" onClick={() => demo('pharmacy_admin')}>{t('actions.loginPharmacy')}</button>
                <button className="btn-secondary" type="button" onClick={() => demo('support_admin')}>{t('actions.loginSupport')}</button>
              </div>
              <p className="mt-6 text-center text-sm text-muted"><Link className="font-semibold text-cyan-700 dark:text-cyan-200" to="/register">{t('actions.register')}</Link></p>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
