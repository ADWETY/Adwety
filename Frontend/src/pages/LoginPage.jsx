import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Moon, Sun } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { t, theme, toggleTheme, isRtl } = usePreferences();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(form);
      toast.success(t('toast.demoReady'));
      if (result?.passwordUpgradeRecommended) toast.warning(t('security.passwordUpgradeRecommended'));
      navigate('/');
    } catch (err) {
      setError(err.message);
      toast.error(t('toast.failed'));
    } finally {
      setLoading(false);
    }
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
            {features.map((item) => (
              <div key={item} className="rounded-2xl bg-white/10 p-4">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="p-6 md:p-10">
          <div className="mb-8 flex flex-wrap justify-between gap-2">
            <Link className="btn-secondary" to="/home">ADWETY</Link>
            <div className="flex gap-2">
              <button className="btn-secondary !p-3" onClick={toggleTheme} type="button">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <LanguageToggle compact />
            </div>
          </div>

          <h2 className={`text-3xl font-bold text-primary ${isRtl ? 'text-right' : ''}`}>
            {t('actions.login')}
          </h2>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div>
              <label className="label">{t('common.email')}</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft" />
                <input
                  dir="ltr"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-left text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  value={form.email}
                  onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                  placeholder="owner@adwety.app"
                />
              </div>
            </div>
            <div>
              <label className="label">{t('common.password')}</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft" />
                <input
                  dir="ltr"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-left text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  type={show ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                  placeholder="••••••••••••"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-soft transition hover:text-cyan-600" onClick={() => setShow((value) => !value)} aria-label={t('actions.togglePasswordVisibility')}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm text-muted">
              <label className="flex items-center gap-2"><input type="checkbox" />{t('actions.rememberMe')}</label>
              <Link className="font-semibold text-cyan-700 dark:text-cyan-200" to="/forgot-password">{t('actions.forgotPassword')}</Link>
            </div>
            {error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
                {error}
              </p>
            ) : null}
            <button className="btn-primary w-full" disabled={loading}>{loading ? t('app.loading') : t('actions.login')}</button>
          </form>
        </section>
      </div>
    </main>
  );
}
