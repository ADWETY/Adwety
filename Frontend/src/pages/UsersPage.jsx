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
  const pharmacyId = String(row.pharmacyId?.id || row.pharmacyId?._id || row.pharmacyId || row.pharmacy_id || '');
  return {
    id: String(row.id || row._id || ''),
    name: row.name || row.fullName || row.full_name || '',
    email: row.email || '',
    role: row.role || 'pharmacist',
    status: isActive ? 'active' : 'inactive',
    pharmacy_id: pharmacyId,
    assigned_pharmacy: row.pharmacyName || row.pharmacy_name || row.pharmacyId?.name || '—',
    phone_number: row.phoneNumber || row.phone_number || '',
    last_login: row.lastLoginAt || row.last_login_at || row.last_login || '',
    created_at: row.createdAt || row.created_at || '',
  };
}

function normalizePharmacy(row = {}) {
  return {
    id: String(row.id || row._id || ''),
    name: row.name || '',
    status: row.status || '',
  };
}

export default function UsersPage() {
  const { t, language } = usePreferences();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [assignedPharmacyId, setAssignedPharmacyId] = useState('');
  const [savingAssignment, setSavingAssignment] = useState(false);
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
      const [usersResult, pharmaciesResult] = await Promise.all([
        getJson(`/users?${params.toString()}`),
        getJson('/pharmacies?limit=100&status=active'),
      ]);
      setRows(extractArray(usersResult).map(normalizeUser).filter((user) => ['admin', 'pharmacist'].includes(user.role)));
      setPharmacies(extractArray(pharmaciesResult).map(normalizePharmacy).filter((item) => item.id));
    } catch (loadError) {
      setError(loadError.message || t('toast.failed'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, [q, role, status]);

  function openUser(user) {
    setSelected(user);
    setAssignedPharmacyId(user.pharmacy_id || '');
  }

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

  async function savePharmacyAssignment() {
    if (!selected || selected.role !== 'pharmacist') return;
    setSavingAssignment(true);
    try {
      const result = await patchJson(`/users/${selected.id}`, { pharmacyId: assignedPharmacyId || null });
      const updated = normalizeUser(result?.data || result);
      setRows((current) => current.map((item) => item.id === selected.id ? updated : item));
      setSelected(updated);
      setAssignedPharmacyId(updated.pharmacy_id || '');
      toast.success(t('toast.updated'));
    } catch (assignmentError) {
      toast.error(assignmentError.message || t('toast.failed'));
    } finally {
      setSavingAssignment(false);
    }
  }

  const filtered = useMemo(() => rows, [rows]);

  return <div className="space-y-6">
    <section className="card p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <input className="input" placeholder={t('actions.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">{t('common.role')}: {t('common.all')}</option>
          {['admin', 'pharmacist'].map((x) => <option key={x} value={x}>{x}</option>)}
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
          <tbody>{filtered.map((user) => <tr key={user.id} className="border-b border-soft"><td className="px-5 py-4 font-medium text-primary">{user.name}</td><td className="px-5 py-4 text-muted">{user.email}</td><td className="px-5 py-4"><span className="badge border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200">{user.role}</span></td><td className="px-5 py-4"><span className={`badge ${statusTone(user.status)}`}>{user.status}</span></td><td className="px-5 py-4 text-muted">{user.assigned_pharmacy}</td><td className="px-5 py-4 text-muted">{user.last_login ? formatDate(user.last_login, language) : '—'}</td><td className="px-5 py-4"><div className="flex gap-2"><button className="btn-secondary !px-3 !py-2" onClick={() => openUser(user)}><Eye className="h-4 w-4" /></button><button className="btn-secondary !px-3 !py-2" onClick={() => toggleUser(user)}>{user.status === 'active' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}</button></div></td></tr>)}</tbody>
        </table>
      </div>}
    </section>

    <Drawer open={Boolean(selected)} title={selected?.name} onClose={() => setSelected(null)}>{selected ? <div className="space-y-4">
      {selected.role === 'pharmacist' ? <section className="rounded-2xl border border-soft p-4">
        <label className="mb-2 block text-sm font-medium text-primary">{t('common.assignedPharmacy')}</label>
        <select className="input" value={assignedPharmacyId} onChange={(event) => setAssignedPharmacyId(event.target.value)}>
          <option value="">—</option>
          {pharmacies.map((pharmacy) => <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>)}
        </select>
        <button className="btn-primary mt-3 w-full" disabled={savingAssignment} onClick={savePharmacyAssignment}>{savingAssignment ? t('common.processing') : t('actions.save')}</button>
      </section> : null}
      {Object.entries(selected).filter(([key]) => key !== 'pharmacy_id').map(([key, value]) => <div key={key} className="flex justify-between gap-4 border-b border-soft pb-3"><span className="text-sm text-muted">{key}</span><span className="text-end font-medium text-primary">{String(value || '—')}</span></div>)}
    </div> : null}</Drawer>
  </div>;
}
