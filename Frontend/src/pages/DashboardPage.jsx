import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BarChart3, Bell, Building2, PackageCheck, Pill, PlusCircle, RefreshCw, Wallet } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { extractArray, getJson } from '../lib/api';
import { stockStatus, stockTone } from '../lib/utils';
import { ROLE_GROUPS, hasRole } from '../lib/roles';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

function MiniBars({ rows }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-primary">{row.label}</span>
            <span className="text-muted">{row.value}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function getNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function getMedicineName(item, fallback) {
  return item?.name || item?.genericName || item?.generic_name || item?.drug?.name || item?.drug?.genericName || item?.drug?.generic_name || fallback;
}

function getMedicineCategory(item, fallback) {
  return item?.category || item?.drug?.category || fallback;
}

function getQuantity(item) {
  return getNumber(item?.quantity, item?.available_quantity, item?.availableQuantity, item?.stock, item?.inventory?.quantity);
}

function getPrice(item) {
  return getNumber(item?.price, item?.unit_price, item?.unitPrice, item?.inventory?.price);
}

function getPharmacyName(item) {
  return item?.pharmacy_name || item?.pharmacyName || item?.pharmacy?.name || '—';
}

function localizedNotification(item, t) {
  if (item?.metadata?.kind === 'low_stock') {
    const medicine = item.metadata.medicineName || item.metadata.medicine_name || item.title;
    const pharmacy = item.metadata.pharmacyName || item.metadata.pharmacy_name || t('common.pharmacy');
    const quantity = item.metadata.quantity ?? '';
    return {
      title: `${t('notifications.lowStockTitle')}: ${medicine}`,
      message: t('notifications.lowStockMessage')
        .replace('{medicine}', medicine)
        .replace('{pharmacy}', pharmacy)
        .replace('{quantity}', String(quantity)),
    };
  }
  if (item?.metadata?.kind === 'pharmacy_request') {
    const status = item.metadata.status || 'pending';
    const pharmacy = item.metadata.pharmacyName || item.metadata.pharmacy_name || '';
    return {
      title: t(`notifications.pharmacyRequest.${status}.title`),
      message: t(`notifications.pharmacyRequest.${status}.message`).replace('{pharmacy}', pharmacy),
    };
  }
  return { title: item?.title || '', message: item?.message || '' };
}

export default function DashboardPage() {
  const { t, language } = usePreferences();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');
  const [dataset, setDataset] = useState({ medicines: [], pharmacies: [], notifications: [] });

  const loadDashboardData = useCallback(async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);

      const [medicines, pharmacies, notifications] = await Promise.all([
        getJson('/medicines'),
        getJson('/pharmacies'),
        getJson('/notifications'),
      ]);

      setDataset({
        medicines: extractArray(medicines),
        pharmacies: extractArray(pharmacies),
        notifications: extractArray(notifications),
      });
      setError('');
      setLastUpdated(new Date().toISOString());
    } catch (loadError) {
      setDataset({ medicines: [], pharmacies: [], notifications: [] });
      setError(loadError?.message || t('dashboard.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const metrics = useMemo(() => {
    const totalStock = dataset.medicines.reduce((sum, item) => sum + getQuantity(item), 0);
    const lowStock = dataset.medicines.filter((item) => getQuantity(item) > 0 && getQuantity(item) < 10).length;
    const outOfStock = dataset.medicines.filter((item) => getQuantity(item) <= 0).length;
    const activePharmacies = dataset.pharmacies.filter((item) => item.status !== 'inactive').length;
    const pricedRows = dataset.medicines.filter((item) => getPrice(item) > 0);
    const averagePrice = pricedRows.length ? pricedRows.reduce((sum, item) => sum + getPrice(item), 0) / pricedRows.length : 0;
    return { totalStock, lowStock, outOfStock, activePharmacies, averagePrice };
  }, [dataset]);

  const categoryRows = useMemo(() => (
    Object.entries(dataset.medicines.reduce((map, item) => {
      const key = getMedicineCategory(item, t('dashboard.generalCategory'));
      map[key] = (map[key] || 0) + getQuantity(item);
      return map;
    }, {})).map(([label, value]) => ({ label, value }))
  ), [dataset.medicines, t]);

  const lowStockRows = useMemo(() => dataset.medicines.filter((item) => getQuantity(item) < 10).slice(0, 6), [dataset.medicines]);

  const quickActions = [
    { to: '/medicines', label: t('nav.medicines'), desc: language === 'ar' ? 'عرض وتصفية مخزون الأدوية' : 'View and filter medicine inventory', icon: Pill, roles: ROLE_GROUPS.medicine },
    { to: '/medicines/new', label: t('nav.addMedicine'), desc: t('pages.addMedicine.description'), icon: PlusCircle, roles: ROLE_GROUPS.admin },
    { to: '/pharmacies', label: t('nav.pharmacies'), desc: language === 'ar' ? 'إدارة الصيدليات والفروع' : 'Manage pharmacies and branches', icon: Building2, roles: ROLE_GROUPS.admin },
    { to: '/pharmacies/new', label: t('nav.addPharmacy'), desc: t('pages.addPharmacy.description'), icon: Building2, roles: ROLE_GROUPS.super },
    { to: '/notifications', label: t('nav.notifications'), desc: language === 'ar' ? 'فتح تنبيهات المخزون والنظام' : 'Open stock and system alerts', icon: Bell, roles: ROLE_GROUPS.notifications },
    { to: '/low-stock', label: t('actions.viewLowStock'), desc: t('pages.lowStock.description'), icon: AlertTriangle, roles: ROLE_GROUPS.admin },
    { to: '/analytics', label: t('actions.openAnalytics'), desc: t('pages.analytics.description'), icon: BarChart3, roles: ROLE_GROUPS.admin },
  ].filter((item) => hasRole(session?.role, item.roles));

  if (loading) return <div className="card p-6 text-sm text-muted">{t('app.loading')}</div>;

  return (
    <div className="space-y-6">
      {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">{error}</div> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Link to="/medicines" className="block h-full transition hover:-translate-y-1"><StatCard label={t('dashboard.totalStock')} value={metrics.totalStock} hint={t('dashboard.combinedQuantity')} icon={PackageCheck} /></Link>
        <Link to="/low-stock" className="block h-full transition hover:-translate-y-1"><StatCard label={t('dashboard.lowStock')} value={metrics.lowStock} hint={t('dashboard.qtyRange')} icon={AlertTriangle} /></Link>
        <Link to="/low-stock" className="block h-full transition hover:-translate-y-1"><StatCard label={t('dashboard.outOfStock')} value={metrics.outOfStock} hint={t('dashboard.qtyZero')} icon={Pill} /></Link>
        <Link to="/pharmacies" className="block h-full transition hover:-translate-y-1"><StatCard label={t('dashboard.activePharmacies')} value={metrics.activePharmacies} hint={t('dashboard.activeBranches')} icon={Building2} /></Link>
        <Link to="/medicines" className="card block h-full min-h-[9.75rem] min-w-0 p-5 transition hover:-translate-y-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium leading-5 text-muted">{t('dashboard.averagePrice')}</p>
              <div className="mt-3 flex min-w-0 items-baseline gap-1.5">
                <span className="block max-w-full truncate text-[clamp(1.65rem,2vw,2.15rem)] font-bold leading-none tracking-tight text-primary">
                  {new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(metrics.averagePrice || 0))}
                </span>
                <span className="shrink-0 whitespace-nowrap text-sm font-bold text-muted">{language === 'ar' ? 'ج.م' : 'EGP'}</span>
              </div>
            </div>
            <span className="shrink-0 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
              <Wallet className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 truncate text-xs text-soft">{t('dashboard.catalogAverage')}</p>
        </Link>
        <Link to="/business-reports" className="block h-full transition hover:-translate-y-1"><StatCard label={t('dashboard.businessReports')} value={categoryRows.length} hint={t('dashboard.reportsCenter')} icon={BarChart3} /></Link>
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-primary">{t('dashboard.quickActions')}</h3>
            {lastUpdated ? <p className="mt-1 text-xs text-soft">{t('dashboard.lastUpdated')}: {new Date(lastUpdated).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-EG')}</p> : null}
          </div>
          <button type="button" onClick={() => loadDashboardData(true)} disabled={refreshing} className="btn-secondary gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {t('dashboard.refreshData')}
          </button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.length ? quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className="sub-card block p-4 transition hover:-translate-y-1 hover:border-cyan-300">
                <Icon className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
                <p className="mt-3 font-semibold text-primary">{item.label}</p>
                <p className="mt-2 text-xs text-muted">{item.desc}</p>
              </Link>
            );
          }) : <EmptyState title={t('common.noData')} />}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Link to="/medicines" className="card block p-6 transition hover:-translate-y-1">
          <h3 className="text-xl font-semibold text-primary">{t('dashboard.stockByCategory')}</h3>
          <div className="mt-5">{categoryRows.length ? <MiniBars rows={categoryRows} /> : <EmptyState title={t('common.noData')} />}</div>
        </Link>
        <Link to="/notifications" className="card block p-6 transition hover:-translate-y-1">
          <h3 className="text-xl font-semibold text-primary">{t('dashboard.recentNotifications')}</h3>
          <div className="mt-5 space-y-3">
            {dataset.notifications.length ? dataset.notifications.slice(0, 4).map((notification) => {
              const display = localizedNotification(notification, t);
              return <div key={notification.id || notification._id || notification.title} className="sub-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-primary">{display.title}</p>
                  <span className="badge border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                    {notification.is_read || notification.read ? t('common.read') : t('common.unread')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted">{display.message}</p>
              </div>;
            }) : <EmptyState title={t('common.noData')} />}
          </div>
        </Link>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soft p-6">
            <h3 className="text-xl font-semibold text-primary">{t('dashboard.lowStockTable')}</h3>
            <Link to="/low-stock" className="btn-secondary !px-3 !py-2 text-xs">{t('actions.viewLowStock')}</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.medicine')}</th><th className="px-5 py-4 font-medium">{t('common.pharmacy')}</th><th className="px-5 py-4 font-medium">{t('common.quantity')}</th><th className="px-5 py-4 font-medium">{t('common.stock')}</th></tr></thead>
              <tbody>
                {lowStockRows.length ? lowStockRows.map((item) => {
                  const quantity = getQuantity(item);
                  return (
                    <tr key={item.inventory_id || item.id || item._id || getMedicineName(item, t('dashboard.unknownMedicine'))} className="border-b border-soft transition hover:bg-cyan-50 dark:hover:bg-white/5">
                      <td className="px-5 py-4 font-medium text-primary"><Link to="/medicines">{getMedicineName(item, t('dashboard.unknownMedicine'))}</Link></td>
                      <td className="px-5 py-4 text-muted">{getPharmacyName(item)}</td>
                      <td className="px-5 py-4 text-muted">{quantity}</td>
                      <td className="px-5 py-4"><span className={`badge ${stockTone(quantity)}`}>{t(`stock.${stockStatus(quantity)}`)}</span></td>
                    </tr>
                  );
                }) : <tr><td colSpan="4" className="px-5 py-8"><EmptyState title={t('common.noData')} /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <Link to="/business-reports" className="card block p-6 transition hover:-translate-y-1">
          <h3 className="text-xl font-semibold text-primary">{t('dashboard.reportsSummary')}</h3>
          <div className="mt-5 space-y-3">
            {categoryRows.slice(0, 4).map((row) => (
              <div key={row.label} className="sub-card flex items-center justify-between p-4">
                <span className="font-medium text-primary">{row.label}</span>
                <span className="text-sm text-muted">{row.value}</span>
              </div>
            ))}
            {!categoryRows.length ? <EmptyState title={t('common.noData')} /> : null}
          </div>
        </Link>
      </section>
    </div>
  );
}
