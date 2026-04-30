import { AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { usePreferences } from '../context/PreferencesContext';

export default function ConfirmDialog({ open, title, message, confirmText, cancelText, variant = 'danger', onConfirm, onClose, children }) {
  const { t, isRtl } = usePreferences();
  if (!open) return null;
  const isDanger = variant === 'danger';
  const Icon = isDanger ? AlertTriangle : Info;
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(event) => event.stopPropagation()}>
        <div className={cn('flex items-start gap-4', isRtl && 'flex-row-reverse text-right')}>
          <div className={cn('rounded-2xl p-3', isDanger ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-200' : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200')}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-semibold text-primary">{title}</h3>
            <p className="mt-2 text-sm text-muted">{message}</p>
            {children}
          </div>
          <button type="button" className="btn-secondary !p-2" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className={cn('mt-6 flex justify-end gap-3', isRtl && 'flex-row-reverse')}>
          <button type="button" className="btn-secondary" onClick={onClose}>{cancelText || t('actions.cancel')}</button>
          <button type="button" className={isDanger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>{confirmText || t('actions.delete')}</button>
        </div>
      </div>
    </div>
  );
}
