import { useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { cn } from '../lib/utils';
import { ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

const PASSWORD_NOTICE_STORAGE_PREFIX = 'adwety_password_upgrade_notice_dismissed';

function getPasswordNoticeStorageKey(session) {
  const identity = session?.id || session?.email;
  if (!identity) return null;
  const policyVersion = Number(session?.passwordPolicyVersion || 1);
  return `${PASSWORD_NOTICE_STORAGE_PREFIX}:${identity}:policy-${policyVersion}`;
}

const pageKeys = [
  ['/', 'dashboard'], ['/retail-dashboard', 'retailDashboard'], ['/products', 'products'], ['/categories', 'categories'], ['/warehouses', 'warehouses'], ['/customers', 'customers'], ['/suppliers', 'suppliers'], ['/pos', 'pos'], ['/purchases', 'purchases'], ['/sales-invoices', 'salesInvoices'], ['/returns', 'returns'], ['/transfers', 'transfers'], ['/inventory-count', 'inventoryCount'], ['/treasury', 'treasury'], ['/business-reports', 'businessReports'], ['/analytics', 'analytics'], ['/medicines/new', 'addMedicine'], ['/medicines', 'medicines'], ['/low-stock', 'lowStock'], ['/pharmacies/new', 'addPharmacy'], ['/pharmacies/', 'pharmacyDetails'], ['/pharmacies', 'pharmacies'], ['/notifications', 'notifications'], ['/pharmacy-requests', 'pharmacyRequests'], ['/support-tickets', 'supportTickets'], ['/users', 'users'], ['/settings', 'settings'], ['/profile', 'profile'],
];

const retailWorkspacePaths = [
  '/retail-dashboard',
  '/pos',
  '/sales-invoices',
  '/purchases',
  '/returns',
  '/products',
  '/categories',
  '/warehouses',
  '/customers',
  '/suppliers',
  '/transfers',
  '/inventory-count',
  '/treasury',
  '/business-reports',
];

function isRetailWorkspacePath(pathname) {
  return retailWorkspacePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function resolvePageKey(pathname) {
  if (pathname === '/') return 'dashboard';
  const match = pageKeys.find(([path]) => path !== '/' && pathname.startsWith(path));
  return match?.[1] || 'dashboard';
}

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, isRtl } = usePreferences();
  const { session } = useAuth();
  const pageKey = resolvePageKey(location.pathname);
  const isRetailWorkspace = isRetailWorkspacePath(location.pathname);
  const passwordNoticeStorageKey = useMemo(
    () => getPasswordNoticeStorageKey(session),
    [session?.id, session?.email, session?.passwordPolicyVersion],
  );
  const [passwordNoticeDismissed, setPasswordNoticeDismissed] = useState(false);

  useEffect(() => {
    if (!session?.passwordUpgradeRecommended || !passwordNoticeStorageKey) {
      setPasswordNoticeDismissed(false);
      return;
    }

    try {
      setPasswordNoticeDismissed(window.localStorage.getItem(passwordNoticeStorageKey) === '1');
    } catch (_error) {
      setPasswordNoticeDismissed(false);
    }
  }, [session?.passwordUpgradeRecommended, passwordNoticeStorageKey]);

  function dismissPasswordUpgradeNotice() {
    setPasswordNoticeDismissed(true);
    if (!passwordNoticeStorageKey) return;
    try { window.localStorage.setItem(passwordNoticeStorageKey, '1'); } catch (_error) {}
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <div className={cn('mx-auto flex w-full gap-6', isRetailWorkspace ? 'max-w-[1840px] 2xl:gap-5' : 'max-w-7xl', isRtl && 'lg:flex-row-reverse')}>
        <Sidebar />
        <div className={cn('fixed inset-0 z-40 bg-slate-950/60 p-4 backdrop-blur lg:hidden', mobileOpen ? 'block' : 'hidden')} onClick={() => setMobileOpen(false)}>
          <div className={cn('h-full w-full max-w-sm', isRtl && 'ms-auto')} onClick={(event) => event.stopPropagation()}><Sidebar mobile onClose={() => setMobileOpen(false)} /></div>
        </div>
        <main className={cn('min-w-0 flex-1', isRetailWorkspace && 'retail-workspace')}>
          <Topbar title={t(`pages.${pageKey}.title`, t('app.controlCenter'))} description={t(`pages.${pageKey}.description`, '')} onMenuClick={() => setMobileOpen(true)} />
          {session?.passwordUpgradeRecommended && !passwordNoticeDismissed ? (
            <div className="relative mb-6 flex flex-col gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 pe-12 text-amber-950 shadow-sm dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                className="absolute end-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-current/20 opacity-75 transition hover:bg-black/5 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current/40 dark:hover:bg-white/10"
                onClick={dismissPasswordUpgradeNotice}
                aria-label={t('security.dismissPasswordUpgradeNotice')}
                title={t('security.dismissPasswordUpgradeNotice')}
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">{t('security.passwordUpgradeTitle')}</p>
                  <p className="mt-1 text-sm opacity-90">{t('security.passwordUpgradeRecommended')}</p>
                </div>
              </div>
              <Link className="btn-secondary shrink-0" to="/settings">{t('security.changePasswordNow')}</Link>
            </div>
          ) : null}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
