import { Link } from 'react-router-dom';
import { usePreferences } from '../context/PreferencesContext';

export default function NotFoundPage() {
  const { t } = usePreferences();
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="card max-w-xl p-8 text-center">
        <h1 className="text-3xl font-semibold text-primary">{t('notFound.title')}</h1>
        <p className="mt-3 text-sm text-muted">{t('notFound.description')}</p>
        <Link to="/" className="btn-primary mt-6">{t('notFound.back')}</Link>
      </div>
    </div>
  );
}
