import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Settings, Trash2, TriangleAlert } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { deleteJson, extractArray, getJson, patchJson } from '../lib/api';
import { formatDate } from '../lib/utils';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

const iconMap = { stock: TriangleAlert, system: Settings };
const toneMap = { stock: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200', system: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200' };

export default function NotificationsPage() {
  const { t, language } = usePreferences();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('type');
  const searchKey = searchParams.toString();
  const [tab, setTab] = useState(['all', 'stock', 'system', 'unread'].includes(requestedTab) ? requestedTab : 'all');
  const [rows, setRows] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getJson('/notifications?limit=100');
      setRows(extractArray(result));
      setError('');
    } catch (loadError) {
      setRows([]);
      setError(loadError.message || t('toast.failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load, searchKey]);

  useEffect(() => {
    if (['all', 'stock', 'system', 'unread'].includes(requestedTab)) setTab(requestedTab);
    else setTab('all');
  }, [requestedTab]);

  const filtered = useMemo(() => rows.filter((item) => tab === 'all' || (tab === 'unread' ? !item.is_read : item.type === tab)), [rows, tab]);

  async function markRead(id) {
    try {
      await patchJson(`/notifications/${id}/read`, {});
      setRows((current) => current.map((item) => item.id === id ? { ...item, is_read: true, isRead: true } : item));
      toast.success(t('toast.updated'));
    } catch (updateError) { toast.error(updateError.message || t('toast.failed')); }
  }

  async function markAllRead() {
    setUpdating(true);
    try {
      await patchJson('/notifications/read-all', {});
      setRows((current) => current.map((item) => ({ ...item, is_read: true, isRead: true })));
      toast.success(t('toast.updated'));
    } catch (updateError) { toast.error(updateError.message || t('toast.failed')); }
    finally { setUpdating(false); }
  }

  async function deleteRow() {
    const item = confirm;
    setConfirm(null);
    try {
      await deleteJson(`/notifications/${item.id}`);
      setRows((current) => current.filter((row) => row.id !== item.id));
      toast.success(t('toast.deleted'));
    } catch (deleteError) { toast.error(deleteError.message || t('toast.failed')); }
  }

  const tabs = [['all', t('notifications.all')], ['stock', t('notifications.stock')], ['system', t('notifications.system')], ['unread', t('notifications.unread')]];

  function changeTab(nextTab) {
    setTab(nextTab);
    const next = new URLSearchParams(searchParams);
    if (nextTab === 'all') next.delete('type');
    else next.set('type', nextTab);
    next.delete('refresh');
    setSearchParams(next, { replace: true });
  }

  function displayText(item) {
    if (item.metadata?.kind === 'low_stock') {
      const medicineName = item.metadata.medicineName || item.metadata.medicine_name || item.title;
      const pharmacyName = item.metadata.pharmacyName || item.metadata.pharmacy_name || '';
      const quantity = item.metadata.quantity ?? '';
      return {
        title: `${t('notifications.lowStockTitle')}: ${medicineName}`,
        message: t('notifications.lowStockMessage')
          .replace('{medicine}', medicineName)
          .replace('{pharmacy}', pharmacyName || t('common.pharmacy'))
          .replace('{quantity}', String(quantity)),
      };
    }
    if (item.metadata?.kind === 'pharmacy_request') {
      const pharmacyName = item.metadata.pharmacyName || item.metadata.pharmacy_name || '';
      const requestStatus = item.metadata.status || 'pending';
      return {
        title: t(`notifications.pharmacyRequest.${requestStatus}.title`),
        message: t(`notifications.pharmacyRequest.${requestStatus}.message`).replace('{pharmacy}', pharmacyName),
      };
    }
    return { title: item.title, message: item.message };
  }

  return <div className="space-y-6">
    {error ? <section className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</section> : null}
    <section className="card p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-2">{tabs.map(([key, label]) => <button key={key} className={tab === key ? 'btn-primary' : 'btn-secondary'} onClick={() => changeTab(key)}>{label}</button>)}</div><button disabled={updating || !rows.length} className="btn-secondary gap-2" onClick={markAllRead}><CheckCheck className="h-4 w-4" />{t('actions.markAllRead')}</button></div></section>
    {loading ? <section className="card p-6 text-sm text-muted">{t('app.loading')}</section> : <section className="space-y-3">{filtered.length ? filtered.map((item) => { const Icon = iconMap[item.type] || Bell; const display = displayText(item); return <article key={item.id} className="card p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="flex gap-4"><div className={`rounded-2xl border p-3 ${toneMap[item.type] || toneMap.system}`}><Icon className="h-5 w-5" /></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-primary">{display.title}</h3><span className="badge border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{item.is_read ? t('common.read') : t('common.unread')}</span></div><p className="mt-2 text-sm text-muted">{display.message}</p><p className="mt-2 text-xs text-soft">{formatDate(item.created_at, language)}</p></div></div><div className="flex gap-2">{!item.is_read ? <button className="btn-secondary !px-3 !py-2" onClick={() => markRead(item.id)}>{t('actions.markRead')}</button> : null}<button className="btn-danger !px-3 !py-2" onClick={() => setConfirm(item)}><Trash2 className="h-4 w-4" /></button></div></div></article>; }) : <EmptyState title={t('common.noData')} />}</section>}
    <ConfirmDialog open={Boolean(confirm)} title={t('actions.delete')} message={confirm?.title} onClose={() => setConfirm(null)} onConfirm={deleteRow} />
  </div>;
}
