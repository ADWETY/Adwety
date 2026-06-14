import { usePreferences } from '../context/PreferencesContext';

export default function LoadingScreen({ text }) {
  const { t } = usePreferences();
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="card p-8 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600 dark:border-cyan-400/20 dark:border-t-cyan-300" />
        <h1 className="mt-5 text-xl font-semibold text-primary">{text || t('app.loadingTitle')}</h1>
        <p className="mt-2 text-sm text-muted">{t('app.loadingDescription')}</p>
      </div>
    </div>
  );
}
