import { RefreshCw } from 'lucide-react';
import EmptyState from './EmptyState';
import { usePreferences } from '../context/PreferencesContext';

export default function ErrorState({ title, message, onRetry }) {
  const { t } = usePreferences();
  return (
    <EmptyState
      title={title || t('toast.failed')}
      description={message}
      action={onRetry ? <button type="button" className="btn-primary gap-2" onClick={onRetry}><RefreshCw className="h-4 w-4" />{t('actions.retry')}</button> : null}
    />
  );
}
