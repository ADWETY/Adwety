import { X } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { cn } from '../lib/utils';

export default function Drawer({ open, title, children, onClose, width = 'max-w-xl' }) {
  const { isRtl, t } = usePreferences();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden" role="dialog" aria-modal="true">
      <button type="button" aria-label={t('actions.closeDrawerOverlay')} className="absolute inset-0 h-full w-full bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <aside className={cn('absolute top-0 h-full w-full overflow-y-auto border-soft bg-white p-6 shadow-2xl transition-transform duration-300 dark:bg-slate-950 sm:w-[34rem]', width, isRtl ? 'left-0 border-r text-right' : 'right-0 border-l')}>
        <div className={cn('mb-6 flex items-center justify-between gap-4', isRtl && 'flex-row-reverse')}>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">ADWETY</p>
            <h2 className="mt-1 truncate text-2xl font-bold text-primary">{title}</h2>
          </div>
          <button type="button" className="btn-secondary !p-2" onClick={onClose} aria-label={t('actions.closeDrawer')}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
      </aside>
    </div>
  );
}
