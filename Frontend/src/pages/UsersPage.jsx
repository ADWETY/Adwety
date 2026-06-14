import { useEffect, useMemo, useState } from 'react';
import { Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import Drawer from '../components/Drawer';
import EmptyState from '../components/EmptyState';
import { extractArray, getJson, patchJson } from '../lib/api';
import { formatDate, statusTone } from '../lib/utils';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

function normalizeUser(row = {}) {
  const isActive = row.isActive ?? row.is_active ?? row.status === 'active';
  return {
    id: String(row.id || row._id || ''),
    name: row.name || row.fullName || row.full_name || '',
    email: row.email || '',
    role: row.role || 'patient',
    status: isActive ? 'active' : 'inactive',
    assigned_pharmacy: row.pharmacyName || row.pharmacy_name || row.pharmacyId || row.pharmacy_id || '—',
    phone_number: row.phoneNumber || row.phone_number || '',
    last_login: row.lastLoginAt || row.last_login_at || row.last_login || '',
    created_at: row.createdAt || row.created_at || '',
  };
}

export default function UsersPage() {
  const { t, language } = usePreferences();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (q) params.set('q', q);
      if (role) params.set('role', role);
      if (status) params.set('isActive', status === 'active' ? 'true' : 'false');
      const result = await getJson(`/users?${params.toString()}`);
      setRows(extractArray(result).map(normalizeUser));
    } catch (loadError) {
      setError(loadError.message || t('toast.failed'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, [q, role, status]);

  async function toggleUser(user) {
    try {
      const nextIsActive = user.status !== 'active';
      const result = await patchJson(`/users/${user.id}`, { isActive: nextIsActive });
      const updated = normalizeUser(result?.data || result);
      setRows((current) => current.map((item) => item.id === user.id ? updated : item));
      toast.success(t('toast.updated'));
    } catch (toggleError) {
      toast.error(toggleError.message || t('toast.failed'));
    }
  }

  const filtered = useMemo(() => rows, [rows]);

  return <div className="space-y-6">
    <section className="card p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <input className="input" placeholder={t('actions.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">{t('common.role')}: {t('common.all')}</option>
          {['admin', 'pharmacist', 'patient'].map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">{t('common.status')}: {t('common.all')}</option>
          <option value="active">{t('common.active')}</option>
          <option value="inactive">{t('common.inactive')}</option>
        </select>
      </div>
      {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</p> : null}
    </section>

    <section className="card overflow-hidden">
      {loading ? <div className="p-6 text-sm text-muted">{t('app.loading')}</div> : !filtered.length ? <div className="p-6"><EmptyState title={t('common.noData')} /></div> : <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.name')}</th><th className="px-5 py-4 font-medium">{t('common.email')}</th><th className="px-5 py-4 font-medium">{t('common.role')}</th><th className="px-5 py-4 font-medium">{t('common.status')}</th><th className="px-5 py-4 font-medium">{t('common.assignedPharmacy')}</th><th className="px-5 py-4 font-medium">{t('common.lastLogin')}</th><th className="px-5 py-4 font-medium">{t('common.actions')}</th></tr></thead>
          <tbody>{filtered.map((user) => <tr key={user.id} className="border-b border-soft"><td className="px-5 py-4 font-medium text-primary">{user.name}</td><td className="px-5 py-4 text-muted">{user.email}</td><td className="px-5 py-4"><span className="badge border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200">{user.role}</span></td><td className="px-5 py-4"><span className={`badge ${statusTone(user.status)}`}>{user.status}</span></td><td className="px-5 py-4 text-muted">{user.assigned_pharmacy}</td><td className="px-5 py-4 text-muted">{user.last_login ? formatDate(user.last_login, language) : '—'}</td><td className="px-5 py-4"><div className="flex gap-2"><button className="btn-secondary !px-3 !py-2" onClick={() => setSelected(user)}><Eye className="h-4 w-4" /></button><button className="btn-secondary !px-3 !py-2" onClick={() => toggleUser(user)}>{user.status === 'active' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}</button></div></td></tr>)}</tbody>
        </table>
      </div>}
    </section>

    <Drawer open={Boolean(selected)} title={selected?.name} onClose={() => setSelected(null)}>{selected ? <div className="space-y-3">{Object.entries(selected).map(([key, value]) => <div key={key} className="flex justify-between border-b border-soft pb-3"><span className="text-sm text-muted">{key}</span><span className="font-medium text-primary">{String(value || '—')}</span></div>)}</div> : null}</Drawer>
  </div>;
}
