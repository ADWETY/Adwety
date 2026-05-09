import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, ScanLine, Settings, Trash2, TriangleAlert } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { extractArray, getJson } from '../lib/api';
import { demoNotifications } from '../lib/demoData';
import { formatDate } from '../lib/utils';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

const iconMap = { stock: TriangleAlert, prescription: ScanLine, system: Settings };
const toneMap = { stock: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200', prescription: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200', system: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200' };

export default function NotificationsPage() {
  const { t, language } = usePreferences();
  const toast = useToast();
  const [tab, setTab] = useState('all');
  const [rows, setRows] = useState(demoNotifications);
  const [confirm, setConfirm] = useState(null);
  useEffect(() => { async function load() { try { const result = await getJson('/notifications'); setRows(extractArray(result, demoNotifications)); } catch (_error) { setRows(demoNotifications); } } load(); }, []);
  const filtered = useMemo(() => rows.filter((item) => tab === 'all' || (tab === 'unread' ? !item.is_read : item.type === tab)), [rows, tab]);
  function markRead(id) { setRows((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item)); toast.success(t('toast.updated')); }
  function markAllRead() { setRows((current) => current.map((item) => ({ ...item, is_read: true }))); toast.success(t('toast.updated')); }
  function deleteRow() { setRows((current) => current.filter((item) => item.id !== confirm.id)); setConfirm(null); toast.success(t('toast.deleted')); }
  const tabs = [['all', t('notifications.all')], ['stock', t('notifications.stock')], ['prescription', t('notifications.prescription')], ['system', t('notifications.system')], ['unread', t('notifications.unread')]];
  return <div className="space-y-6"><section className="card p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-2">{tabs.map(([key, label]) => <button key={key} className={tab === key ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab(key)}>{label}</button>)}</div><button className="btn-secondary gap-2" onClick={markAllRead}><CheckCheck className="h-4 w-4" />{t('actions.markAllRead')}</button></div></section><section className="space-y-3">{filtered.length ? filtered.map((item) => { const Icon = iconMap[item.type] || Bell; return <article key={item.id} className="card p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="flex gap-4"><div className={`rounded-2xl border p-3 ${toneMap[item.type] || toneMap.system}`}><Icon className="h-5 w-5" /></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-primary">{item.title}</h3><span className="badge border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{item.is_read ? t('common.read') : t('common.unread')}</span></div><p className="mt-2 text-sm text-muted">{item.message}</p><p className="mt-2 text-xs text-soft">{formatDate(item.created_at, language)}</p></div></div><div className="flex gap-2"><button className="btn-secondary !px-3 !py-2" onClick={() => markRead(item.id)}>{t('actions.markRead')}</button><button className="btn-danger !px-3 !py-2" onClick={() => setConfirm(item)}><Trash2 className="h-4 w-4" /></button></div></div></article>; }) : <EmptyState title={t('common.noData')} />}</section><ConfirmDialog open={Boolean(confirm)} title={t('actions.delete')} message={confirm?.title} onClose={() => setConfirm(null)} onConfirm={deleteRow} /></div>;
}
