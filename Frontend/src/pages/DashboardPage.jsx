import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BarChart3, Building2, PackageCheck, Pill, PlusCircle, ScanLine, Wallet } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { getJson } from '../lib/api';
import { demoMedicines, demoNotifications, demoPharmacies, demoScanTrend } from '../lib/demoData';
import { formatCurrency, stockStatus, stockTone } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';

function MiniBars({ rows }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return <div className="space-y-4">{rows.map((row) => <div key={row.label}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-primary">{row.label}</span><span className="text-muted">{row.value}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }} /></div></div>)}</div>;
}

export default function DashboardPage() {
  const { t, language } = usePreferences();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState({ medicines: demoMedicines, pharmacies: demoPharmacies, notifications: demoNotifications });

  useEffect(() => {
    async function load() {
      try {
        const [medicines, pharmacies, notifications] = await Promise.all([getJson('/medicines'), getJson('/pharmacies'), getJson('/notifications')]);
        setDataset({ medicines: medicines.data || demoMedicines, pharmacies: pharmacies.data || demoPharmacies, notifications: notifications.data || demoNotifications });
      } catch (_error) {
        setDataset({ medicines: demoMedicines, pharmacies: demoPharmacies, notifications: demoNotifications });
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const metrics = useMemo(() => {
    const totalStock = dataset.medicines.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const lowStock = dataset.medicines.filter((item) => Number(item.quantity || 0) > 0 && Number(item.quantity || 0) < 10).length;
    const outOfStock = dataset.medicines.filter((item) => Number(item.quantity || 0) <= 0).length;
    const activePharmacies = dataset.pharmacies.filter((item) => item.status !== 'inactive').length;
    const averagePrice = dataset.medicines.length ? dataset.medicines.reduce((sum, item) => sum + Number(item.price || 0), 0) / dataset.medicines.length : 0;
    return { totalStock, lowStock, outOfStock, activePharmacies, averagePrice, aiScans: 15 };
  }, [dataset]);

  const categoryRows = useMemo(() => Object.entries(dataset.medicines.reduce((map, item) => { const key = item.category || 'General'; map[key] = (map[key] || 0) + Number(item.quantity || 0); return map; }, {})).map(([label, value]) => ({ label, value })), [dataset.medicines]);
  const lowStockRows = dataset.medicines.filter((item) => Number(item.quantity || 0) < 10).slice(0, 6);
  const quickActions = [
    { to: '/medicines/new', label: t('actions.add') + ' ' + t('common.medicine'), desc: t('pages.addMedicine.description'), icon: PlusCircle, roles: ['super_admin', 'pharmacy_admin'] },
    { to: '/pharmacies/new', label: t('nav.addPharmacy'), desc: t('pages.addPharmacy.description'), icon: Building2, roles: ['super_admin'] },
    { to: '/prescriptions', label: t('actions.scanPrescription'), desc: t('pages.scanner.description'), icon: ScanLine, roles: ['super_admin', 'pharmacy_admin', 'user'] },
    { to: '/low-stock', label: t('actions.viewLowStock'), desc: t('pages.lowStock.description'), icon: AlertTriangle, roles: ['super_admin', 'pharmacy_admin'] },
    { to: '/analytics', label: t('actions.openAnalytics'), desc: t('pages.analytics.description'), icon: BarChart3, roles: ['super_admin', 'pharmacy_admin'] },
  ].filter((item) => item.roles.includes(session?.role));

  if (loading) return <div className="card p-6 text-sm text-muted">{t('app.loading')}</div>;

  return (
    <div className="space-y-6">
      {session?.demoMode ? <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-medium text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200">{t('app.demoMode')}: ADWETY is running with presentation-ready fallback data.</div> : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label={t('dashboard.totalStock')} value={metrics.totalStock} hint="Combined quantity" icon={PackageCheck} />
        <StatCard label={t('dashboard.lowStock')} value={metrics.lowStock} hint="Qty 1 - 9" icon={AlertTriangle} />
        <StatCard label={t('dashboard.outOfStock')} value={metrics.outOfStock} hint="Qty 0" icon={Pill} />
        <StatCard label={t('dashboard.activePharmacies')} value={metrics.activePharmacies} hint="Active branches" icon={Building2} />
<div className="card min-w-0 p-5">
  <div className="flex items-start justify-between gap-3">
    <div className="min-w-0 flex-1">
      <p className="line-clamp-2 text-sm font-medium leading-5 text-muted">
        {t('dashboard.averagePrice')}
      </p>

      <div className="mt-3 flex min-w-0 items-baseline gap-1.5">
        <span className="block max-w-full truncate text-[clamp(1.65rem,2vw,2.15rem)] font-bold leading-none tracking-tight text-primary">
          {new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(Number(metrics.averagePrice || 0))}
        </span>

        <span className="shrink-0 whitespace-nowrap text-sm font-bold text-muted">
          {language === 'ar' ? 'ج.م' : 'EGP'}
        </span>
      </div>
    </div>

    <span className="shrink-0 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200">
      <Wallet className="h-5 w-5" />
    </span>
  </div>

  <p className="mt-3 truncate text-xs text-soft">
    {language === 'ar' ? 'متوسط الكتالوج' : 'Catalog average'}
  </p>
</div>        <StatCard label={t('dashboard.aiScans')} value={metrics.aiScans} hint="Scanner activity" icon={ScanLine} />
      </section>

      <section className="card p-6">
        <h3 className="text-xl font-semibold text-primary">{t('dashboard.quickActions')}</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {quickActions.map((item) => { const Icon = item.icon; return <Link key={item.to} to={item.to} className="sub-card block p-4 transition hover:-translate-y-1 hover:border-cyan-300"><Icon className="h-6 w-6 text-cyan-600 dark:text-cyan-300" /><p className="mt-3 font-semibold text-primary">{item.label}</p><p className="mt-2 text-xs text-muted">{item.desc}</p></Link>; })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-6"><h3 className="text-xl font-semibold text-primary">{t('dashboard.stockByCategory')}</h3><div className="mt-5">{categoryRows.length ? <MiniBars rows={categoryRows} /> : <EmptyState title={t('common.noData')} />}</div></div>
        <div className="card p-6"><h3 className="text-xl font-semibold text-primary">{t('dashboard.recentNotifications')}</h3><div className="mt-5 space-y-3">{dataset.notifications.slice(0, 4).map((notification) => <div key={notification.id} className="sub-card p-4"><div className="flex items-center justify-between gap-3"><p className="font-medium text-primary">{notification.title}</p><span className="badge border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{notification.is_read ? t('common.read') : t('common.unread')}</span></div><p className="mt-2 text-sm text-muted">{notification.message}</p></div>)}</div></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="card overflow-hidden"><div className="border-b border-soft p-6"><h3 className="text-xl font-semibold text-primary">{t('dashboard.lowStockTable')}</h3></div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.medicine')}</th><th className="px-5 py-4 font-medium">{t('common.pharmacy')}</th><th className="px-5 py-4 font-medium">{t('common.quantity')}</th><th className="px-5 py-4 font-medium">{t('common.stock')}</th></tr></thead><tbody>{lowStockRows.map((item) => <tr key={item.inventory_id || item.id} className="border-b border-soft"><td className="px-5 py-4 font-medium text-primary">{item.name}</td><td className="px-5 py-4 text-muted">{item.pharmacy_name || '—'}</td><td className="px-5 py-4 text-muted">{item.quantity}</td><td className="px-5 py-4"><span className={`badge ${stockTone(item.quantity)}`}>{t(`stock.${stockStatus(item.quantity)}`)}</span></td></tr>)}</tbody></table></div></div>
        <div className="card p-6"><h3 className="text-xl font-semibold text-primary">{t('dashboard.aiSummary')}</h3><div className="mt-5 space-y-3">{demoScanTrend.slice(-4).map((row) => <div key={row.label} className="sub-card flex items-center justify-between p-4"><span className="font-medium text-primary">{row.label}</span><span className="text-sm text-muted">{row.scans} scans</span></div>)}</div></div>
      </section>
    </div>
  );
}
