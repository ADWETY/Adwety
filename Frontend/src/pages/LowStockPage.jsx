import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Search } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { useToast } from '../context/ToastContext';
import { usePreferences } from '../context/PreferencesContext';
import { extractArray, getJson, postJson } from '../lib/api';
import { stockStatus, stockTone } from '../lib/utils';

export default function LowStockPage() {
  const { t } = usePreferences();
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [error, setError] = useState('');
  const [notifying, setNotifying] = useState('');
  const [query, setQuery] = useState('');
  const [pharmacy, setPharmacy] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [result, pharmacyResult] = await Promise.all([getJson('/medicines'), getJson('/pharmacies')]);
        setRows(extractArray(result));
        setPharmacies(extractArray(pharmacyResult));
        setError('');
      } catch (loadError) {
        setRows([]);
        setPharmacies([]);
        setError(loadError.message || t('toast.failed'));
      }
    }
    load();
  }, [t]);

  const baseRows = useMemo(() => rows.filter((item) => Number(item.quantity || 0) < 10).filter((item) => {
    const text = `${item.name} ${item.category} ${item.pharmacy_name}`.toLowerCase();
    if (query && !text.includes(query.toLowerCase())) return false;
    if (pharmacy && item.pharmacy_id !== pharmacy) return false;
    if (category && item.category !== category) return false;
    return true;
  }), [rows, query, pharmacy, category]);

  const lowRows = useMemo(() => baseRows.filter((item) => {
    if (status && stockStatus(item.quantity) !== status) return false;
    return true;
  }), [baseRows, status]);

  const categories = Array.from(new Set(rows.map((item) => item.category).filter(Boolean)));
  const lowStockCount = baseRows.filter((item) => stockStatus(item.quantity) === 'low_stock').length;
  const outOfStockCount = baseRows.filter((item) => stockStatus(item.quantity) === 'out_of_stock').length;
  const affected = new Set(baseRows.map((item) => item.pharmacy_id || item.pharmacy_name).filter(Boolean)).size;

  async function notifyPharmacy(item) {
    if (!item.pharmacy_id) { toast.error(t('toast.failed')); return; }
    setNotifying(item.inventory_id || item.id);
    try {
      await postJson('/notifications/notify-pharmacy', {
        pharmacyId: item.pharmacy_id,
        type: 'stock',
        title: `${t('stock.low_stock')}: ${item.name}`,
        message: `${item.name} - ${t('common.quantity')}: ${item.quantity}`,
        metadata: {
          kind: 'low_stock',
          inventoryId: item.inventory_id,
          drugId: item.drug_id,
          medicineName: item.name,
          pharmacyName: item.pharmacy_name,
          quantity: item.quantity,
        },
      });
      toast.success(t('notifications.sentSuccessfully'));
      navigate(`/notifications?type=stock&refresh=${Date.now()}`);
    } catch (notifyError) {
      toast.error(notifyError.message || t('toast.failed'));
    } finally {
      setNotifying('');
    }
  }

  return (
    <div className="space-y-6">
      {error ? <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</section> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label={t('dashboard.lowStock')}
          value={lowStockCount}
          icon={AlertTriangle}
          onClick={() => setStatus((current) => (current === 'low_stock' ? '' : 'low_stock'))}
          active={status === 'low_stock'}
          ariaLabel={t('dashboard.lowStock')}
        />
        <StatCard
          label={t('dashboard.outOfStock')}
          value={outOfStockCount}
          icon={AlertTriangle}
          onClick={() => setStatus((current) => (current === 'out_of_stock' ? '' : 'out_of_stock'))}
          active={status === 'out_of_stock'}
          ariaLabel={t('dashboard.outOfStock')}
        />
        <StatCard
          label={t('common.affectedPharmacies')}
          value={affected}
          icon={Bell}
          onClick={() => setStatus('')}
          active={!status}
          ariaLabel={t('common.affectedPharmacies')}
        />
      </section>

      <section className="card p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="label">{t('actions.search')}</label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-4 top-3.5 h-4 w-4 text-soft" />
              <input className="input ps-11" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">{t('common.pharmacy')}</label>
            <select className="input" value={pharmacy} onChange={(e) => setPharmacy(e.target.value)}>
              <option value="">{t('common.all')}</option>
              {pharmacies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('common.category')}</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{t('common.all')}</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('common.status')}</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">{t('common.all')}</option>
              <option value="low_stock">{t('stock.low_stock')}</option>
              <option value="out_of_stock">{t('stock.out_of_stock')}</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-5 py-4 font-medium">{t('common.medicine')}</th>
                <th className="px-5 py-4 font-medium">{t('common.pharmacy')}</th>
                <th className="px-5 py-4 font-medium">{t('common.category')}</th>
                <th className="px-5 py-4 font-medium">{t('common.quantity')}</th>
                <th className="px-5 py-4 font-medium">{t('common.status')}</th>
                <th className="px-5 py-4 font-medium">{t('common.recommendedAction')}</th>
              </tr>
            </thead>
            <tbody>
              {lowRows.length ? lowRows.map((item) => (
                <tr key={item.inventory_id || item.id} className="border-b border-soft">
                  <td className="px-5 py-4 font-medium text-primary">{item.name}</td>
                  <td className="px-5 py-4 text-muted">{item.pharmacy_name}</td>
                  <td className="px-5 py-4 text-muted">{item.category}</td>
                  <td className="px-5 py-4 text-muted">{item.quantity}</td>
                  <td className="px-5 py-4"><span className={`badge ${stockTone(item.quantity)}`}>{t(`stock.${stockStatus(item.quantity)}`)}</span></td>
                  <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button disabled={notifying === (item.inventory_id || item.id)} className="btn-primary !px-3 !py-2" onClick={() => notifyPharmacy(item)}><Bell className="h-4 w-4" /></button></div></td>
                </tr>
              )) : <tr><td colSpan="6" className="px-5 py-8"><EmptyState title={t('common.noData')} /></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
