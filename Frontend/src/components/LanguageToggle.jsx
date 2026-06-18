import { Languages } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';

export default function LanguageToggle() {
  const { language, setLanguage, t } = usePreferences();

  const isArabic = language === 'ar';

  return (
    <button
      type="button"
      onClick={() => setLanguage(isArabic ? 'en' : 'ar')}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-500/50 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-200"
      aria-label={isArabic ? t('actions.switchToEnglish') : t('actions.switchToArabic')}
      title={isArabic ? t('actions.switchToEnglish') : t('actions.switchToArabic')}
    >
      <span className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200">
        <Languages className="h-3.5 w-3.5" />
      </span>

      <span className="leading-none">
        {isArabic ? t('common.english') : t('common.arabic')}
      </span>
    </button>
  );
}