import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Building2, PackageCheck, ScanLine } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { CardSkeleton } from '../components/Skeleton';
import { getJson } from '../lib/api';
import { demoMedicines, demoPharmacies, demoScanTrend } from '../lib/demoData';
import { stockStatus } from '../lib/utils';
import { usePreferences } from '../context/PreferencesContext';

function BarChart({ rows }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return <div className="space-y-4">{rows.map((row) => <div key={row.label}><div className="mb-2 flex justify-between text-sm"><span className="font-medium text-primary">{row.label}</span><span className="text-muted">{row.value}</span></div><div className="h-4 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(5, row.value / max * 100)}%` }} /></div></div>)}</div>;
}
function PieLegend({ rows }) { const total = Math.max(1, rows.reduce((sum, row) => sum + row.value, 0)); return <div className="grid gap-3">{rows.map((row) => <div key={row.label} className="sub-card p-4"><div className="flex items-center justify-between"><span className="font-medium text-primary">{row.label}</span><span className="text-sm text-muted">{row.value} · {Math.round(row.value / total * 100)}%</span></div><div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800"><div className="h-2 rounded-full bg-cyan-500" style={{ width: `${row.value / total * 100}%` }} /></div></div>)}</div>; }
function LineChart({ rows, keyName = 'scans' }) { const max = Math.max(1, ...rows.map((row) => row[keyName])); return <div className="flex h-52 items-end gap-3 border-b border-l border-soft p-4">{rows.map((row) => <div key={row.label} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-2xl bg-cyan-500" style={{ height: `${Math.max(12, row[keyName] / max * 160)}px` }} /><span className="text-xs text-muted">{row.label}</span></div>)}</div>; }

export default function AnalyticsPage() {
  const { t } = usePreferences();
  const [range, setRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState({ medicines: demoMedicines, pharmacies: demoPharmacies });
  useEffect(() => { async function load() { try { const [medicines, pharmacies] = await Promise.all([getJson('/medicines'), getJson('/pharmacies')]); setRows({ medicines: medicines.data || demoMedicines, pharmacies: pharmacies.data || demoPharmacies }); } catch (_error) { setRows({ medicines: demoMedicines, pharmacies: demoPharmacies }); } finally { setLoading(false); } } load(); }, []);
  const metrics = useMemo(() => ({ totalStock: rows.medicines.reduce((sum, item) => sum + Number(item.quantity || 0), 0), low: rows.medicines.filter((item) => stockStatus(item.quantity) === 'low_stock').length, out: rows.medicines.filter((item) => stockStatus(item.quantity) === 'out_of_stock').length, active: rows.pharmacies.filter((item) => item.status !== 'inactive').length, scans: demoScanTrend.at(-1)?.scans || 0 }), [rows]);
  const byCategory = useMemo(() => Object.entries(rows.medicines.reduce((map, item) => { const key = item.category || 'General'; map[key] = (map[key] || 0) + Number(item.quantity || 0); return map; }, {})).map(([label, value]) => ({ label, value })), [rows.medicines]);
  const statusRows = useMemo(() => ['in_stock', 'low_stock', 'out_of_stock'].map((key) => ({ label: t(`stock.${key}`), value: rows.medicines.filter((item) => stockStatus(item.quantity) === key).length })), [rows.medicines, t]);
  const topPharmacies = useMemo(() => rows.pharmacies.map((pharmacy) => ({ label: pharmacy.name, value: rows.medicines.filter((item) => item.pharmacy_id === pharmacy.id || item.pharmacy_name === pharmacy.name).reduce((sum, item) => sum + Number(item.quantity || 0), 0) || Number(pharmacy.inventory_count || 0) })).sort((a, b) => b.value - a.value), [rows]);
  if (loading) return <div className="grid gap-4 md:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>;
  return <div className="space-y-6">
    <section className="card p-6"><div className="flex flex-wrap items-center justify-between gap-4"><h3 className="text-xl font-semibold text-primary">{t('nav.analytics')}</h3><select className="input max-w-xs" value={range} onChange={(e) => setRange(e.target.value)}><option value="today">{t('common.today')}</option><option value="week">{t('common.thisWeek')}</option><option value="month">{t('common.thisMonth')}</option><option value="custom">{t('common.customRange')}</option></select></div></section>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><StatCard label={t('dashboard.totalStock')} value={metrics.totalStock} icon={PackageCheck} /><StatCard label={t('dashboard.lowStock')} value={metrics.low} icon={AlertTriangle} /><StatCard label={t('dashboard.outOfStock')} value={metrics.out} icon={Activity} /><StatCard label={t('dashboard.activePharmacies')} value={metrics.active} icon={Building2} /><StatCard label={t('dashboard.aiScans')} value={metrics.scans} icon={ScanLine} /></section>
    <section className="grid gap-6 xl:grid-cols-2"><div className="card p-6"><h3 className="text-xl font-semibold text-primary">{t('dashboard.stockByCategory')}</h3><div className="mt-5">{byCategory.length ? <BarChart rows={byCategory} /> : <EmptyState title={t('common.noData')} />}</div></div><div className="card p-6"><h3 className="text-xl font-semibold text-primary">{t('dashboard.statusPie')}</h3><div className="mt-5"><PieLegend rows={statusRows} /></div></div></section>
    <section className="grid gap-6 xl:grid-cols-2"><div className="card p-6"><h3 className="text-xl font-semibold text-primary">{t('dashboard.scanTrend')}</h3><LineChart rows={demoScanTrend} keyName="scans" /></div><div className="card p-6"><h3 className="text-xl font-semibold text-primary">{t('dashboard.lowTrend')}</h3><LineChart rows={demoScanTrend} keyName="low" /></div></section>
    <section className="card p-6"><h3 className="text-xl font-semibold text-primary">{t('dashboard.topPharmacies')}</h3><div className="mt-5"><BarChart rows={topPharmacies} /></div></section>
  </div>;
}
