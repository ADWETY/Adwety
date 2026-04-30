import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, XCircle } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { demoRequests } from '../lib/demoData';
import { getJson, patchJson } from '../lib/api';
import { formatDate, statusTone } from '../lib/utils';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

function normalizeRequest(item) {
  return {
    id: item.id,
    pharmacy_name: item.pharmacy_name || item.metadata?.pharmacy_name || item.requested_name,
    owner_name: item.requested_name || item.owner_name,
    phone: item.requested_phone || item.phone,
    email: item.requested_email || item.email,
    address: item.pharmacy_address || item.address || item.metadata?.pharmacy_address || '',
    status: item.status,
    requested_role: item.requested_role || item.role || 'pharmacy_admin',
    request_type: item.request_type || 'pharmacy_admin',
    created_at: item.submitted_at || item.created_at,
    rejection_reason: item.rejection_reason || '',
  };
}

export default function PharmacyRequestsPage() {
  const { t, language } = usePreferences();
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [rows, setRows] = useState(demoRequests.map((item) => ({ ...item, requested_role: 'pharmacy_admin', request_type: 'pharmacy_admin' })));
  const [rejecting, setRejecting] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getJson('/approval-requests')
      .then((res) => {
        if (!active) return;
        setRows((res.data || []).map(normalizeRequest));
      })
      .catch(() => {
        if (active) toast.info(t('auth.ownerOnlyApproval'));
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [t, toast]);

  const filtered = useMemo(() => rows.filter((item) => item.status === tab), [rows, tab]);

  async function approve(item) {
    try {
      const res = await patchJson(`/approval-requests/${item.id}/approve`, {});
      const updated = normalizeRequest(res.data);
      setRows((current) => current.map((row) => row.id === item.id ? updated : row));
      toast.success(t('toast.updated'));
    } catch (err) {
      toast.error(err.message || t('toast.failed'));
    }
  }

  async function reject(item) {
    try {
      const res = await patchJson(`/approval-requests/${item.id}/reject`, { rejection_reason: reason });
      const updated = normalizeRequest(res.data);
      setRows((current) => current.map((row) => row.id === item.id ? updated : row));
      setRejecting(null);
      setReason('');
      toast.success(t('toast.updated'));
    } catch (err) {
      toast.error(err.message || t('toast.failed'));
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex flex-wrap gap-2">{['pending', 'approved', 'rejected'].map((key) => <button key={key} className={tab === key ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab(key)}>{t(`common.${key}`)}</button>)}</div>
      </section>

      {loading ? <section className="card p-6 text-muted">{t('app.loading')}</section> : null}

      {!loading && !filtered.length ? <EmptyState title={t('common.noData')} description={t('auth.ownerOnlyApproval')} /> : null}

      <section className="grid gap-4 xl:grid-cols-2">
        {filtered.map((item) => <article key={item.id} className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-primary">{item.pharmacy_name || item.owner_name}</h3>
              <p className="mt-2 text-sm text-muted">{item.address}</p>
            </div>
            <span className={`badge ${statusTone(item.status)}`}>{t(`common.${item.status}`)}</span>
          </div>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <p><span className="text-muted">{t('common.owner')}: </span><span className="font-medium text-primary">{item.owner_name}</span></p>
            <p><span className="text-muted">{t('common.requestedRole')}: </span><span className="font-medium text-primary">{t(`roles.${item.requested_role}`)}</span></p>
            <p><span className="text-muted">{t('common.phone')}: </span><span className="font-medium text-primary">{item.phone}</span></p>
            <p><span className="text-muted">{t('common.email')}: </span><span className="font-medium text-primary">{item.email}</span></p>
            <p><span className="text-muted">{t('common.createdDate')}: </span><span className="font-medium text-primary">{formatDate(item.created_at, language)}</span></p>
            <p><span className="text-muted">{t('common.requestType')}: </span><span className="font-medium text-primary">{item.request_type}</span></p>
          </div>
          {item.rejection_reason ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{item.rejection_reason}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2"><button className="btn-secondary gap-2" onClick={() => setSelected(item)}><Eye className="h-4 w-4" />{t('actions.review')}</button>{item.status === 'pending' ? <><button className="btn-primary gap-2" onClick={() => approve(item)}><CheckCircle2 className="h-4 w-4" />{t('actions.approve')}</button><button className="btn-danger gap-2" onClick={() => setRejecting(item)}><XCircle className="h-4 w-4" />{t('actions.reject')}</button></> : null}</div>
        </article>)}
      </section>

      {selected ? <ConfirmDialog open title={t('actions.review')} message={`${selected.owner_name} - ${t(`roles.${selected.requested_role}`)} - ${selected.email}`} confirmText={t('actions.close')} onClose={() => setSelected(null)} onConfirm={() => setSelected(null)} /> : null}

      <ConfirmDialog open={Boolean(rejecting)} title={t('actions.reject')} message={rejecting?.pharmacy_name || rejecting?.owner_name} confirmText={t('actions.reject')} onClose={() => { setRejecting(null); setReason(''); }} onConfirm={() => reject(rejecting)}>
        <textarea className="input mt-3 min-h-24" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('common.rejectionReason')} />
      </ConfirmDialog>
    </div>
  );
}
