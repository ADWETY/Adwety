import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, RefreshCw, XCircle } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Drawer from '../components/Drawer';
import { extractArray, extractObject, getJson, patchJson } from '../lib/api';
import { formatDate, statusTone } from '../lib/utils';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

function normalizeRequest(row = {}) {
  return {
    ...row,
    id: String(row.id || row._id || ''),
    pharmacy_name: row.pharmacy_name || row.pharmacyName || row.name || '',
    address: row.address || '',
    owner_name: row.owner_name || row.ownerName || row.owner?.name || '—',
    phone: row.phone || row.owner_phone || row.ownerPhone || '',
    email: row.email || row.owner_email || row.ownerEmail || '',
    status: row.status || 'pending',
    created_at: row.created_at || row.createdAt || '',
    working_hours: row.working_hours || row.workingHours || '',
  };
}

const requestTabs = ['pending', 'approved', 'rejected'];

export default function PharmacyRequestsPage() {
  const { t, language } = usePreferences();
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [rejecting, setRejecting] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');

  const loadRequests = useCallback(async (status = tab) => {
    setLoading(true);
    setError('');
    try {
      const result = await getJson(`/pharmacy-requests?status=${status}&limit=100`);
      const object = extractObject(result, {});
      setRows(extractArray(result).map(normalizeRequest));
      setCounts({ pending: 0, approved: 0, rejected: 0, ...(object.counts || {}) });
    } catch (loadError) {
      setRows([]);
      setError(loadError.message || t('toast.failed'));
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

  useEffect(() => { loadRequests(tab); }, [tab, loadRequests]);

  const filtered = useMemo(() => rows.filter((item) => item.status === tab), [rows, tab]);

  async function updateStatus(item, status) {
    const action = status === 'approved' ? 'approve' : 'reject';
    setUpdatingId(item.id);
    try {
      await patchJson(`/pharmacy-requests/${item.id}/${action}`, {});
      toast.success(status === 'approved' ? t('pharmacyRequests.approvedSuccess') : t('pharmacyRequests.rejectedSuccess'));
      setReviewing(null);
      setRejecting(null);
      await loadRequests(tab);
    } catch (updateError) {
      toast.error(updateError.message || t('toast.failed'));
    } finally {
      setUpdatingId('');
    }
  }

  return <div className="space-y-6">
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {requestTabs.map((key) => (
            <button key={key} type="button" className={tab === key ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab(key)}>
              <span>{t(`common.${key}`)}</span>
              <span className="badge border-white/20 bg-white/10 text-current">{counts[key] || 0}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn-secondary gap-2" disabled={loading} onClick={() => loadRequests(tab)}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t('actions.refresh')}
        </button>
      </div>
      {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</p> : null}
    </section>

    {loading ? (
      <section className="card p-6 text-sm text-muted">{t('app.loading')}</section>
    ) : !filtered.length ? (
      <section className="card p-6">
        <EmptyState title={t('pharmacyRequests.noRequestsForStatus')} description={t(`pharmacyRequests.empty.${tab}`)} />
      </section>
    ) : (
      <section className="grid gap-4 xl:grid-cols-2">
        {filtered.map((item) => (
          <article key={item.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-primary">{item.pharmacy_name}</h3>
                <p className="mt-2 text-sm text-muted">{item.address || '—'}</p>
              </div>
              <span className={`badge ${statusTone(item.status)}`}>{t(`common.${item.status}`)}</span>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <p><span className="text-muted">{t('common.owner')}: </span><span className="font-medium text-primary">{item.owner_name}</span></p>
              <p><span className="text-muted">{t('common.phone')}: </span><span className="font-medium text-primary">{item.phone || '—'}</span></p>
              <p><span className="text-muted">{t('common.email')}: </span><span className="font-medium text-primary">{item.email || '—'}</span></p>
              <p><span className="text-muted">{t('common.createdDate')}: </span><span className="font-medium text-primary">{item.created_at ? formatDate(item.created_at, language) : '—'}</span></p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-secondary gap-2" onClick={() => setReviewing(item)}>
                <Eye className="h-4 w-4" />{t('actions.review')}
              </button>
              {item.status === 'pending' ? <>
                <button disabled={updatingId === item.id} className="btn-primary gap-2" onClick={() => updateStatus(item, 'approved')}>
                  <CheckCircle2 className="h-4 w-4" />{t('actions.approve')}
                </button>
                <button disabled={updatingId === item.id} className="btn-danger gap-2" onClick={() => setRejecting(item)}>
                  <XCircle className="h-4 w-4" />{t('actions.reject')}
                </button>
              </> : null}
            </div>
          </article>
        ))}
      </section>
    )}

    <Drawer open={Boolean(reviewing)} title={t('actions.review')} onClose={() => setReviewing(null)}>
      {reviewing ? <div className="space-y-4">
        <div className="sub-card p-4">
          <h3 className="text-xl font-semibold text-primary">{reviewing.pharmacy_name}</h3>
          <p className="mt-2 text-sm text-muted">{reviewing.address || '—'}</p>
        </div>
        {[
          [t('common.owner'), reviewing.owner_name],
          [t('common.phone'), reviewing.phone],
          [t('common.email'), reviewing.email],
          [t('common.status'), t(`common.${reviewing.status}`)],
          [t('common.workingHours'), reviewing.working_hours],
          [t('common.createdDate'), reviewing.created_at ? formatDate(reviewing.created_at, language) : '—'],
        ].map(([label, value]) => <div key={label} className="flex justify-between gap-4 border-b border-soft pb-3"><span className="text-sm text-muted">{label}</span><span className="font-medium text-primary">{value || '—'}</span></div>)}
        {reviewing.status === 'pending' ? <div className="flex gap-3 pt-3">
          <button disabled={updatingId === reviewing.id} className="btn-primary" onClick={() => updateStatus(reviewing, 'approved')}>{t('actions.approve')}</button>
          <button disabled={updatingId === reviewing.id} className="btn-danger" onClick={() => { setRejecting(reviewing); setReviewing(null); }}>{t('actions.reject')}</button>
        </div> : null}
      </div> : null}
    </Drawer>

    <ConfirmDialog
      open={Boolean(rejecting)}
      title={t('actions.reject')}
      message={t('pharmacyRequests.confirmReject').replace('{pharmacy}', rejecting?.pharmacy_name || '')}
      confirmText={t('actions.reject')}
      onClose={() => setRejecting(null)}
      onConfirm={() => updateStatus(rejecting, 'rejected')}
    />
  </div>;
}
