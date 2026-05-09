import { Link } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import RoleBadge from './RoleBadge';
import { env } from '../config/env';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

export default function Topbar({ title, description, onMenuClick }) {
  const { session } = useAuth();
  const { theme, toggleTheme, t, isRtl } = usePreferences();
  const toast = useToast();

  function changeTheme() {
    toggleTheme();
    toast.info(t('toast.themeChanged'));
  }

  return (
    <div className="card mb-6 p-5">
      <div className={cn('flex flex-col gap-4 md:flex-row md:items-start md:justify-between', isRtl && 'md:flex-row-reverse')}>
        <div className={cn('flex items-start gap-3', isRtl && 'flex-row-reverse text-right')}>
          <button type="button" onClick={onMenuClick} className="btn-secondary lg:hidden" aria-label="Open menu">
            <Menu className="h-4 w-4" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-700 dark:text-cyan-200/70">{env.appName}</p>
            <h2 className="mt-2 text-2xl font-semibold text-primary">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>
          </div>
        </div>
        <div className={cn('flex flex-wrap items-center gap-3', isRtl && 'justify-end')}>
          <button type="button" onClick={changeTheme} className="btn-secondary gap-2">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? t('app.lightMode') : t('app.darkMode')}
          </button>
          <LanguageToggle />
          <Link to="/profile" className="transition hover:-translate-y-0.5" title={t('pages.profile.title', 'Profile')}>
            <RoleBadge role={session?.role} />
          </Link>
          <Link to="/prescriptions" className="badge border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:-translate-y-0.5 hover:border-emerald-300 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200" title={t('nav.prescriptionScanner', 'Prescription scanner')}>
            {t('app.ai')}: {env.aiProvider}
          </Link>
        </div>
      </div>
    </div>
  );
}
