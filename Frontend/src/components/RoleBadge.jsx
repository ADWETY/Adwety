import { cn } from '../lib/utils';
import { usePreferences } from '../context/PreferencesContext';

const tones = {
  owner: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200',
  super_admin: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200',
  pharmacy_admin: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-200',
  support_admin: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200',
};

export default function RoleBadge({ role }) {
  const { language } = usePreferences();
  const labels = language === 'ar'
    ? { owner: 'المالك', super_admin: 'مدير عام', pharmacy_admin: 'مدير صيدلية', support_admin: 'دعم فني', user: 'مستخدم' }
    : { owner: 'Owner', super_admin: 'Super Admin', pharmacy_admin: 'Pharmacy Admin', support_admin: 'Support Admin', user: 'User' };
  return (
    <span className={cn('badge', tones[role] || 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200')}>
      {labels[role] || role}
    </span>
  );
}
