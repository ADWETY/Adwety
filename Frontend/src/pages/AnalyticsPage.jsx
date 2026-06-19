import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Building2, PackageCheck } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { CardSkeleton } from '../components/Skeleton';
import { extractObject, getJson } from '../lib/api';
import { usePreferences } from '../context/PreferencesContext';

function BarChart({ rows }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.value || row.quantity || 0)));
  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const value = Number(row.value ?? row.quantity ?? 0);
        return (
          <div key={row.label || row.name}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-primary">{row.label || row.name}</span>
              <span className="text-muted">{value}</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max(5, (value / max) * 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PieLegend({ rows }) {
  const total = Math.max(1, rows.reduce((sum, row) => sum + Number(row.value || 0), 0));
  return (
    <div className="grid gap-3">
      {rows.map((row) => (
        <div key={row.label} className="sub-card p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-primary">{row.label}</span>
            <span className="text-sm text-muted">{row.value} · {Math.round((row.value / total) * 100)}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${(row.value / total) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { t } = usePreferences();
  const navigate = useNavigate();
  const [range, setRange] = useState('week');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ range });
        if (range === 'custom' && from) params.set('from', from);
        if (range === 'custom' && to) params.set('to', to);
        const result = await getJson(`/analytics?${params.toString()}`);
        if (!cancelled) {
          setData(extractObject(result));
          setError('');
        }
      } catch (loadError) {
        if (!cancelled) {
          setData({});
          setError(loadError.message || t('toast.failed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [range, from, to, t]);

  const metrics = {
    totalStock: Number(data.total_stock || 0),
    low: Number(data.low_stock_items || 0),
    out: Number(data.out_of_stock_items || 0),
    active: Number(data.active_pharmacies || 0),
  };

  const byCategory = Array.isArray(data.stock_by_category) ? data.stock_by_category : [];
  const statusRows = useMemo(
    () => (Array.isArray(data.stock_status) ? data.stock_status : []).map((row) => ({
      label: t(`stock.${row.key}`),
      value: Number(row.value || 0),
    })),
    [data.stock_status, t]
  );
  const topPharmacies = (Array.isArray(data.top_pharmacies) ? data.top_pharmacies : []).map((row) => ({
    label: row.name,
    value: Number(row.quantity || 0),
  }));

  if (loading) {
    return <div className="grid gap-4 md:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>;
  }

  return (
    <div className="space-y-6">
      {error ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
          {error}
        </section>
      ) : null}

      <section className="card p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h3 className="text-xl font-semibold text-primary">{t('nav.analytics')}</h3>
          <div className="flex flex-wrap gap-3">
            <select className="input max-w-xs" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="today">{t('common.today')}</option>
              <option value="week">{t('common.thisWeek')}</option>
              <option value="month">{t('common.thisMonth')}</option>
              <option value="all">{t('common.all')}</option>
              <option value="custom">{t('common.customRange')}</option>
            </select>
            {range === 'custom' ? (
              <>
                <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('dashboard.totalStock')}
          value={metrics.totalStock}
          icon={PackageCheck}
          onClick={() => navigate('/medicines')}
          ariaLabel={`${t('dashboard.totalStock')} - ${t('actions.viewDetails')}`}
        />
        <StatCard
          label={t('dashboard.lowStock')}
          value={metrics.low}
          icon={AlertTriangle}
          onClick={() => navigate('/low-stock?status=low_stock')}
          ariaLabel={`${t('dashboard.lowStock')} - ${t('actions.viewDetails')}`}
        />
        <StatCard
          label={t('dashboard.outOfStock')}
          value={metrics.out}
          icon={Activity}
          onClick={() => navigate('/low-stock?status=out_of_stock')}
          ariaLabel={`${t('dashboard.outOfStock')} - ${t('actions.viewDetails')}`}
        />
        <StatCard
          label={t('dashboard.activePharmacies')}
          value={metrics.active}
          icon={Building2}
          onClick={() => navigate('/pharmacies?status=active')}
          ariaLabel={`${t('dashboard.activePharmacies')} - ${t('actions.viewDetails')}`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-primary">{t('dashboard.stockByCategory')}</h3>
          <div className="mt-5">{byCategory.length ? <BarChart rows={byCategory} /> : <EmptyState title={t('common.noData')} />}</div>
        </div>
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-primary">{t('dashboard.statusPie')}</h3>
          <div className="mt-5">{statusRows.length ? <PieLegend rows={statusRows} /> : <EmptyState title={t('common.noData')} />}</div>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="text-xl font-semibold text-primary">{t('dashboard.topPharmacies')}</h3>
        <div className="mt-5">{topPharmacies.length ? <BarChart rows={topPharmacies} /> : <EmptyState title={t('common.noData')} />}</div>
      </section>
    </div>
  );
}
