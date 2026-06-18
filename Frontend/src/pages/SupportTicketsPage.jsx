import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, UserPlus, XCircle } from 'lucide-react';
import Drawer from '../components/Drawer';
import EmptyState from '../components/EmptyState';
import { extractArray, getJson, patchJson } from '../lib/api';
import { formatDate, priorityTone, statusTone } from '../lib/utils';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

function normalizeTicket(row = {}) {
  return {
    id: String(row.id || row._id || ''),
    title: row.title || '',
    message: row.message || '',
    user: row.user || row.userName || row.user_name || row.userEmail || row.user_email || '—',
    pharmacy: row.pharmacy || row.pharmacyName || row.pharmacy_name || '—',
    priority: row.priority || 'normal',
    status: row.status || 'open',
    assigned_admin: row.assigned_admin || row.assignedAdmin || '',
    created_at: row.created_at || row.createdAt || '',
  };
}

export default function SupportTicketsPage() {
  const { t, language } = usePreferences();
  const toast = useToast();
  const [tab, setTab] = useState('open');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadTickets(status = tab) {
    setLoading(true);
    setError('');
    try {
      const result = await getJson(`/support-tickets?status=${status}&limit=100`);
      setRows(extractArray(result).map(normalizeTicket));
    } catch (loadError) {
      setError(loadError.message || t('toast.failed'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTickets(tab); }, [tab]);

  const filtered = useMemo(() => rows.filter((item) => item.status === tab), [rows, tab]);

  async function updateTicket(item, changes) {
    try {
      const result = await patchJson(`/support-tickets/${item.id}`, changes);
      const updated = normalizeTicket(result?.data || result);
      setRows((current) => current.map((row) => row.id === item.id ? updated : row));
      toast.success(t('toast.updated'));
      loadTickets(tab);
    } catch (updateError) {
      toast.error(updateError.message || t('toast.failed'));
    }
  }

  return <div className="space-y-6">
    <section className="card p-6"><div className="flex flex-wrap gap-2">{['open', 'in_progress', 'resolved', 'closed'].map((key) => <button key={key} className={tab === key ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab(key)}>{t(key === 'in_progress' ? 'common.inProgress' : `common.${key}`)}</button>)}</div>{error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</p> : null}</section>
    <section className="card overflow-hidden">
      {loading ? <div className="p-6 text-sm text-muted">{t('app.loading')}</div> : !filtered.length ? <div className="p-6"><EmptyState title={t('common.noData')} /></div> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.title')}</th><th className="px-5 py-4 font-medium">{t('common.user')}</th><th className="px-5 py-4 font-medium">{t('common.priority')}</th><th className="px-5 py-4 font-medium">{t('common.status')}</th><th className="px-5 py-4 font-medium">{t('common.date')}</th><th className="px-5 py-4 font-medium">{t('common.actions')}</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className="border-b border-soft"><td className="px-5 py-4 font-medium text-primary">{item.title}</td><td className="px-5 py-4 text-muted">{item.user}</td><td className="px-5 py-4"><span className={`badge ${priorityTone(item.priority)}`}>{item.priority}</span></td><td className="px-5 py-4"><span className={`badge ${statusTone(item.status)}`}>{item.status}</span></td><td className="px-5 py-4 text-muted">{item.created_at ? formatDate(item.created_at, language) : '—'}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button className="btn-secondary !px-3 !py-2" onClick={() => setSelected(item)}><Eye className="h-4 w-4" /></button><button className="btn-secondary !px-3 !py-2" onClick={() => updateTicket(item, { status: 'in_progress', assigned_admin: 'Me' })}><UserPlus className="h-4 w-4" /></button><button className="btn-primary !px-3 !py-2" onClick={() => updateTicket(item, { status: 'resolved' })}><CheckCircle2 className="h-4 w-4" /></button><button className="btn-danger !px-3 !py-2" onClick={() => updateTicket(item, { status: 'closed' })}><XCircle className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>}
    </section>
    <Drawer open={Boolean(selected)} title={selected?.title} onClose={() => setSelected(null)}>{selected ? <div className="space-y-3"><p className="text-muted">{selected.message}</p>{[[t('common.user'), selected.user], [t('common.pharmacy'), selected.pharmacy], [t('common.priority'), selected.priority], [t('common.status'), selected.status], [t('common.assignedAdmin'), selected.assigned_admin || '—']].map(([label, value]) => <div className="flex justify-between border-b border-soft pb-3" key={label}><span className="text-sm text-muted">{label}</span><span className="font-medium text-primary">{value}</span></div>)}</div> : null}</Drawer>
  </div>;
}
