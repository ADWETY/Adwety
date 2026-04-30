import { useEffect, useMemo, useState } from 'react';
import { Eye, ShieldCheck, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';
import { demoUsers } from '../lib/demoData';
import { deleteJson, getJson, patchJson } from '../lib/api';
import { formatDate, statusTone } from '../lib/utils';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

function normalizeAdmin(item) {
  return {
    id: item.id,
    name: item.name || item.fullName,
    email: item.email,
    role: item.role,
    status: item.status || (item.is_active ? 'active' : 'inactive'),
    approval_status: item.approval_status || 'approved',
    assigned_pharmacy: item.assigned_pharmacy || '—',
    last_login: item.last_login,
    created_at: item.created_at,
  };
}

export default function UsersPage() {
  const { t, language } = usePreferences();
  const toast = useToast();
  const [rows, setRows] = useState([{ id: 'owner-demo', name: 'System Owner', email: 'owner@adwety.app', role: 'owner', status: 'active', assigned_pharmacy: 'System', last_login: '2026-04-29T08:30:00.000Z' }, ...demoUsers]);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    getJson('/admins')
      .then((res) => setRows((res.data || []).map(normalizeAdmin)))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => rows.filter((item) => {
    const text = `${item.name} ${item.email}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (role && item.role !== role) return false;
    if (status && item.status !== status) return false;
    return true;
  }), [rows, q, role, status]);

  async function toggleUser(user) {
    if (user.role === 'owner') {
      toast.info(t('auth.ownerOnlyApproval'));
      return;
    }
    const nextActive = user.status !== 'active';
    try {
      const res = await patchJson(`/admins/${user.id}`, { is_active: nextActive });
      const updated = normalizeAdmin(res.data);
      setRows((current) => current.map((item) => item.id === user.id ? updated : item));
      toast.success(t('toast.updated'));
    } catch (err) {
      toast.error(err.message || t('toast.failed'));
    }
  }

  async function changeRole(user) {
    if (user.role === 'owner') {
      toast.info(t('auth.ownerOnlyApproval'));
      return;
    }
    const order = ['support_admin', 'pharmacy_admin', 'super_admin'];
    const nextRole = order[(order.indexOf(user.role) + 1 + order.length) % order.length];
    try {
      const res = await patchJson(`/admins/${user.id}`, { role: nextRole });
      const updated = normalizeAdmin(res.data);
      setRows((current) => current.map((item) => item.id === user.id ? updated : item));
      toast.success(t('toast.updated'));
    } catch (err) {
      toast.error(err.message || t('toast.failed'));
    }
  }

  async function removeUser(user) {
    try {
      await deleteJson(`/admins/${user.id}`);
      setRows((current) => current.filter((item) => item.id !== user.id));
      setDeleting(null);
      toast.success(t('toast.deleted'));
    } catch (err) {
      toast.error(err.message || t('toast.failed'));
    }
  }

  return <div className="space-y-6"><section className="card p-6"><div className="grid gap-4 md:grid-cols-3"><input className="input" placeholder={t('actions.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} /><select className="input" value={role} onChange={(e) => setRole(e.target.value)}><option value="">{t('common.role')}: {t('common.all')}</option>{['owner', 'super_admin','pharmacy_admin','support_admin'].map((x) => <option key={x} value={x}>{t(`roles.${x}`)}</option>)}</select><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">{t('common.status')}: {t('common.all')}</option><option value="active">{t('common.active')}</option><option value="inactive">{t('common.inactive')}</option></select></div></section><section className="card overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.name')}</th><th className="px-5 py-4 font-medium">{t('common.email')}</th><th className="px-5 py-4 font-medium">{t('common.role')}</th><th className="px-5 py-4 font-medium">{t('common.status')}</th><th className="px-5 py-4 font-medium">{t('common.assignedPharmacy')}</th><th className="px-5 py-4 font-medium">{t('common.lastLogin')}</th><th className="px-5 py-4 font-medium">{t('common.actions')}</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id} className="border-b border-soft"><td className="px-5 py-4 font-medium text-primary">{user.name}</td><td className="px-5 py-4 text-muted">{user.email}</td><td className="px-5 py-4"><span className="badge border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200">{t(`roles.${user.role}`)}</span></td><td className="px-5 py-4"><span className={`badge ${statusTone(user.status)}`}>{user.status}</span></td><td className="px-5 py-4 text-muted">{user.assigned_pharmacy}</td><td className="px-5 py-4 text-muted">{formatDate(user.last_login, language)}</td><td className="px-5 py-4"><div className="flex gap-2"><button className="btn-secondary !px-3 !py-2" onClick={() => setSelected(user)}><Eye className="h-4 w-4" /></button><button className="btn-secondary !px-3 !py-2" onClick={() => changeRole(user)}><ShieldCheck className="h-4 w-4" /></button><button className="btn-secondary !px-3 !py-2" onClick={() => toggleUser(user)}>{user.status === 'active' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}</button><button className="btn-danger !px-3 !py-2" onClick={() => setDeleting(user)}><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div></section><Drawer open={Boolean(selected)} title={selected?.name} onClose={() => setSelected(null)}>{selected ? <div className="space-y-3">{Object.entries(selected).map(([key, value]) => <div key={key} className="flex justify-between border-b border-soft pb-3"><span className="text-sm text-muted">{key}</span><span className="font-medium text-primary">{String(value ?? '')}</span></div>)}</div> : null}</Drawer><ConfirmDialog open={Boolean(deleting)} title={t('actions.delete')} message={deleting?.name} confirmText={t('actions.delete')} onClose={() => setDeleting(null)} onConfirm={() => removeUser(deleting)} /></div>;
}
