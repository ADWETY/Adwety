import { Link } from 'react-router-dom';
import { BarChart3, Bell, Languages, Pill, ShoppingCart, Store } from 'lucide-react';
import LanguageToggle from '../components/LanguageToggle';
import { usePreferences } from '../context/PreferencesContext';

export default function LandingPage() {
  const { t, theme, toggleTheme } = usePreferences();
  const features = [
    [t('landing.featureInventory'), Pill],
    [t('landing.featurePharmacies'), Store],
    [t('landing.featurePos'), ShoppingCart],
    [t('landing.featureAlerts'), Bell],
    [t('landing.featureAnalytics'), BarChart3],
    [t('landing.featureLanguages'), Languages],
  ];

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8">
      <nav className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-200">ADWETY</p>
          <p className="font-semibold text-primary">{t('pages.landing.title')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={toggleTheme} type="button">{t(`common.${theme}`)}</button>
          <LanguageToggle compact />
          <Link className="btn-primary" to="/login">{t('actions.login')}</Link>
        </div>
      </nav>

      <section className="grid min-h-[70vh] items-center gap-8 py-12 xl:grid-cols-2">
        <div>
          <span className="badge border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200">{t('app.graduationDemo')}</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-primary md:text-6xl">{t('pages.landing.title')}</h1>
          <p className="mt-6 max-w-xl text-lg text-muted">{t('landing.heroLead')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn-primary" to="/register">{t('actions.getStarted')}</Link>
            <Link className="btn-secondary" to="/login">{t('actions.login')}</Link>
          </div>
        </div>

        <div className="card p-6">
          <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 dark:border-cyan-400/20 dark:bg-cyan-500/10">
            <ShoppingCart className="h-12 w-12 text-cyan-600 dark:text-cyan-200" />
            <h2 className="mt-4 text-2xl font-semibold text-primary">{t('nav.pos', 'Point of Sale')}</h2>
            <p className="mt-3 text-muted">{t('landing.step2')} · {t('landing.step3')}</p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {features.map(([label, Icon]) => (
              <div key={label} className="sub-card p-4">
                <Icon className="h-5 w-5 text-cyan-500" />
                <p className="mt-3 font-medium text-primary">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-2xl font-semibold text-primary">{t('landing.howItWorks')}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[t('landing.step1'), t('landing.step2'), t('landing.step3')].map((step, index) => (
            <div key={step} className="sub-card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500 font-bold text-white">{index + 1}</span>
              <p className="mt-4 text-muted">{step}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
