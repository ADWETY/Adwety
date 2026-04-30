import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { cn } from '../lib/utils';
import { usePreferences } from '../context/PreferencesContext';

const pageKeys = [
  ['/', 'dashboard'], ['/analytics', 'analytics'], ['/medicines/new', 'addMedicine'], ['/medicines', 'medicines'], ['/low-stock', 'lowStock'], ['/pharmacies/new', 'addPharmacy'], ['/pharmacies/', 'pharmacyDetails'], ['/pharmacies', 'pharmacies'], ['/prescriptions', 'scanner'], ['/notifications', 'notifications'], ['/pharmacy-requests', 'pharmacyRequests'], ['/support-tickets', 'supportTickets'], ['/users', 'users'], ['/settings', 'settings'], ['/profile', 'profile'],
];

function resolvePageKey(pathname) {
  if (pathname === '/') return 'dashboard';
  const match = pageKeys.find(([path]) => path !== '/' && pathname.startsWith(path));
  return match?.[1] || 'dashboard';
}

export default function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, isRtl } = usePreferences();
  const pageKey = resolvePageKey(location.pathname);

  return (
    <div className="min-h-screen px-4 py-6 md:px-6">
      <div className={cn('mx-auto flex max-w-7xl gap-6', isRtl && 'lg:flex-row-reverse')}>
        <Sidebar />
        <div className={cn('fixed inset-0 z-40 bg-slate-950/60 p-4 backdrop-blur lg:hidden', mobileOpen ? 'block' : 'hidden')} onClick={() => setMobileOpen(false)}>
          <div className={cn('max-w-xs', isRtl && 'ms-auto')} onClick={(event) => event.stopPropagation()}><Sidebar mobile /></div>
        </div>
        <main className="min-w-0 flex-1">
          <Topbar title={t(`pages.${pageKey}.title`, t('app.controlCenter'))} description={t(`pages.${pageKey}.description`, '')} onMenuClick={() => setMobileOpen(true)} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
