import { BarChart3, Bell, Boxes, Building2, ClipboardCheck, ClipboardList, FileText, Headphones, Home, LogOut, PackagePlus, PackageX, Pill, PlusCircle, Receipt, RotateCcw, Settings, ShoppingCart, Tags, Truck, Users, WalletCards, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import RoleBadge from './RoleBadge';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { cn } from '../lib/utils';
import { ROLE_GROUPS, hasRole } from '../lib/roles';

const items = [
  { to: '/', labelKey: 'nav.dashboard', label: 'Dashboard', icon: Home, roles: ROLE_GROUPS.dashboard },
  { to: '/retail-dashboard', labelKey: 'nav.retailDashboard', label: 'Retail Dashboard', icon: BarChart3, roles: ROLE_GROUPS.retail },
  { to: '/pos', labelKey: 'nav.pos', label: 'POS Sales', icon: ShoppingCart, roles: ROLE_GROUPS.retail },
  { to: '/sales-invoices', labelKey: 'nav.salesInvoices', label: 'Invoices', icon: FileText, roles: ROLE_GROUPS.retail },
  { to: '/purchases', labelKey: 'nav.purchases', label: 'Purchases', icon: PackagePlus, roles: ROLE_GROUPS.retail },
  { to: '/returns', labelKey: 'nav.returns', label: 'Returns', icon: RotateCcw, roles: ROLE_GROUPS.retail },
  { to: '/products', labelKey: 'nav.products', label: 'Products', icon: Boxes, roles: ROLE_GROUPS.retail },
  { to: '/categories', labelKey: 'nav.categories', label: 'Categories', icon: Tags, roles: ROLE_GROUPS.retail },
  { to: '/inventory-count', labelKey: 'nav.inventoryCount', label: 'Stocktake', icon: ClipboardCheck, roles: ROLE_GROUPS.retail },
  { to: '/suppliers', labelKey: 'nav.suppliers', label: 'Suppliers', icon: Truck, roles: ROLE_GROUPS.retail },
  { to: '/treasury', labelKey: 'nav.treasury', label: 'Treasury', icon: WalletCards, roles: ROLE_GROUPS.retail },
  { to: '/business-reports', labelKey: 'nav.businessReports', label: 'Business Reports', icon: Receipt, roles: ROLE_GROUPS.retail },
  { to: '/medicines', labelKey: 'nav.medicines', label: 'Medicines', icon: Pill, roles: ROLE_GROUPS.medicine },
  { to: '/medicines/new', labelKey: 'nav.addMedicine', label: 'Add Medicine', icon: PlusCircle, roles: ROLE_GROUPS.hidden },
  { to: '/low-stock', labelKey: 'nav.lowStock', label: 'Low Stock', icon: PackageX, roles: ROLE_GROUPS.admin },
  { to: '/pharmacies', labelKey: 'nav.pharmacies', label: 'Pharmacies', icon: Building2, roles: ROLE_GROUPS.admin },
  { to: '/pharmacies/new', labelKey: 'nav.addPharmacy', label: 'Add Pharmacy', icon: PlusCircle, roles: ROLE_GROUPS.super },
  { to: '/analytics', labelKey: 'nav.analytics', label: 'Analytics', icon: BarChart3, roles: ROLE_GROUPS.admin },
  { to: '/notifications', labelKey: 'nav.notifications', label: 'Notifications', icon: Bell, roles: ROLE_GROUPS.notifications },
  { to: '/pharmacy-requests', labelKey: 'nav.pharmacyRequests', label: 'Pharmacy Requests', icon: ClipboardList, roles: ROLE_GROUPS.hidden },
  { to: '/support-tickets', labelKey: 'nav.supportTickets', label: 'Support Tickets', icon: Headphones, roles: ROLE_GROUPS.support },
  { to: '/users', labelKey: 'nav.users', label: 'Users', icon: Users, roles: ROLE_GROUPS.super },
  { to: '/settings', labelKey: 'nav.settings', label: 'Settings', icon: Settings, roles: ROLE_GROUPS.settings },
];

export default function Sidebar({ mobile = false, onClose }) {
  const { session, logout } = useAuth();
  const { t, isRtl, language } = usePreferences();
  const visibleItems = items.filter((item) => hasRole(session?.role, item.roles));

  return (
    <aside className={cn('card h-[calc(100vh-3rem)] w-72 shrink-0 flex-col p-5', mobile ? 'mobile-sidebar flex h-full w-full p-3' : 'sticky top-6 hidden lg:flex')}>
      {mobile ? (
        <div className={cn('mb-2 flex items-center justify-between gap-2', isRtl && 'flex-row-reverse')}>
          <span className="text-sm font-bold text-primary">{t('app.menu', 'Menu')}</span>
          <button
            type="button"
            onClick={onClose}
            className="mobile-sidebar-close"
            aria-label={t('app.closeMenu', 'Close menu')}
            title={t('app.closeMenu', 'Close menu')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="sidebar-brand rounded-3xl border border-cyan-200 bg-cyan-50 p-5 dark:border-cyan-400/20 dark:bg-cyan-500/10">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-700 dark:text-cyan-200/80">BAHAMAS / MATGR</p>
        <h1 className="mt-2 text-2xl font-semibold text-primary">{t('app.controlCenter')}</h1>
        <p className="mt-2 text-sm text-muted">{t('app.sidebarSubtitle')}</p>
      </div>

      <div className="sidebar-user mt-5 sub-card p-4">
        <p className="text-sm font-medium text-primary">{session?.name}</p>
        <p className="mt-1 text-xs text-muted">{session?.email}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <RoleBadge role={session?.role} />
        </div>
      </div>

      <nav className="sidebar-nav mt-5 flex-1 space-y-2 overflow-y-auto pe-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={mobile ? onClose : undefined}
              className={({ isActive }) => cn('sidebar-link flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition', isRtl && 'flex-row-reverse text-right', isActive ? 'bg-cyan-600 text-white shadow-sm dark:bg-white dark:text-slate-950' : 'text-muted hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-white/5 dark:hover:text-white')}
            >
              <Icon className="sidebar-link-icon h-4 w-4" />
              <span className="flex-1">{t(item.labelKey, item.label)}</span>
            </NavLink>
          );
        })}
      </nav>

      <button type="button" onClick={logout} className={cn('sidebar-logout btn-secondary w-full gap-2', isRtl && 'flex-row-reverse')}>
        <LogOut className="h-4 w-4" />
        {t('app.signOut')}
      </button>
    </aside>
  );
}
