import { BarChart3, Bell, Building2, ClipboardList, Headphones, Home, LogOut, PackageX, Pill, PlusCircle, ScanSearch, Settings, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import RoleBadge from './RoleBadge';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { cn } from '../lib/utils';

const items = [
  { to: '/', labelKey: 'nav.dashboard', icon: Home, roles: ['owner', 'super_admin', 'pharmacy_admin', 'support_admin'] },
  { to: '/medicines', labelKey: 'nav.medicines', icon: Pill, roles: ['owner', 'super_admin', 'pharmacy_admin', 'user'] },
  { to: '/medicines/new', labelKey: 'nav.addMedicine', icon: PlusCircle, roles: ['owner', 'super_admin', 'pharmacy_admin'] },
  { to: '/low-stock', labelKey: 'nav.lowStock', icon: PackageX, roles: ['owner', 'super_admin', 'pharmacy_admin'] },
  { to: '/pharmacies', labelKey: 'nav.pharmacies', icon: Building2, roles: ['owner', 'super_admin', 'pharmacy_admin'] },
  { to: '/pharmacies/new', labelKey: 'nav.addPharmacy', icon: PlusCircle, roles: ['owner', 'super_admin'] },
  { to: '/analytics', labelKey: 'nav.analytics', icon: BarChart3, roles: ['owner', 'super_admin', 'pharmacy_admin'] },
  { to: '/prescriptions', labelKey: 'nav.prescriptionScanner', icon: ScanSearch, roles: ['owner', 'super_admin', 'pharmacy_admin', 'user'] },
  { to: '/notifications', labelKey: 'nav.notifications', icon: Bell, roles: ['owner', 'super_admin', 'pharmacy_admin', 'support_admin'] },
  { to: '/pharmacy-requests', labelKey: 'nav.pharmacyRequests', icon: ClipboardList, roles: ['owner', 'super_admin'] },
  { to: '/support-tickets', labelKey: 'nav.supportTickets', icon: Headphones, roles: ['owner', 'super_admin', 'support_admin'] },
  { to: '/users', labelKey: 'nav.users', icon: Users, roles: ['owner', 'super_admin'] },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings, roles: ['owner', 'super_admin', 'pharmacy_admin', 'support_admin', 'user'] },
];

export default function Sidebar({ mobile = false }) {
  const { session, logout } = useAuth();
  const { t, isRtl } = usePreferences();
  const visibleItems = items.filter((item) => item.roles.includes(session?.role));

  return (
    <aside className={cn('card h-[calc(100vh-3rem)] w-72 shrink-0 flex-col p-5', mobile ? 'flex' : 'sticky top-6 hidden lg:flex')}>
      <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-400/20 dark:bg-cyan-500/10">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-700 dark:text-cyan-200/80">ADWETY</p>
        <h1 className="mt-2 text-2xl font-semibold text-primary">{t('app.controlCenter')}</h1>
        <p className="mt-2 text-sm text-muted">{t('app.subtitle')}</p>
      </div>

      <div className="mt-5 sub-card p-4">
        <p className="text-sm font-medium text-primary">{session?.name}</p>
        <p className="mt-1 text-xs text-muted">{session?.email}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RoleBadge role={session?.role} />
          {session?.demoMode ? <span className="badge border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200">{t('app.demoMode')}</span> : null}
        </div>
      </div>

      <nav className="mt-5 flex-1 space-y-2 overflow-y-auto pe-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition', isRtl && 'flex-row-reverse text-right', isActive ? 'bg-cyan-600 text-white shadow-sm dark:bg-white dark:text-slate-950' : 'text-muted hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-white/5 dark:hover:text-white')}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>

      <button type="button" onClick={logout} className={cn('btn-secondary w-full gap-2', isRtl && 'flex-row-reverse')}>
        <LogOut className="h-4 w-4" />
        {t('app.signOut')}
      </button>
    </aside>
  );
}
