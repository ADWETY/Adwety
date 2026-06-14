import { useMemo, useState } from 'react';
import { ArrowRightLeft, CheckCircle2, Search, XCircle } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { formatDate, statusTone } from '../lib/utils';
import { makeId, useStoreState } from '../lib/storeData';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

export default function StoreWarehousesPage() {
  const { t, language, isRtl } = usePreferences();
  const toast = useToast();
  const [store, setStore] = useStoreState();
  const [form, setForm] = useState({ productId: store.products[0]?.id || '', from: store.warehouses[0]?.name || '', to: store.warehouses[1]?.name || store.warehouses[0]?.name || '', qty: 1 });
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...store.transfers].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!term) return sorted;
    return sorted.filter((item) => [item.id, item.productName, item.from, item.to, item.status].join(' ').toLowerCase().includes(term));
  }, [search, store.transfers]);

  function updateField(name, value) { setForm((current) => ({ ...current, [name]: value })); }

  function requestTransfer(event) {
    event.preventDefault();
    const product = store.products.find((item) => item.id === form.productId);
    if (!product || !Number(form.qty)) { toast.warning(t('toast.requiredFields')); return; }
    setConfirm({ variant: 'info', title: t('store.confirmTransferTitle'), message: `${t('store.confirmTransfer')} ${product.name}?`, confirmText: t('actions.create'), onConfirm: () => saveTransfer(product) });
  }

  function saveTransfer(product) {
    const qty = Math.max(1, Number(form.qty || 1));
    const row = { id: makeId('TR'), productName: product.name, barcode: product.barcode, from: form.from, to: form.to, qty, status: 'pending', date: new Date().toISOString() };
    setStore((current) => ({ ...current, transfers: [row, ...current.transfers] }));
    toast.success(t('toast.created'));
    setConfirm(null);
  }

  function setStatus(row, status) {
    setConfirm({ variant: 'info', title: t('actions.confirmUpdate'), message: `${t('store.confirmTransferStatus')} ${row.id}?`, confirmText: t('actions.update'), onConfirm: () => {
      setStore((current) => ({ ...current, transfers: current.transfers.map((item) => (item.id === row.id ? { ...item, status } : item)) }));
      toast.success(t('toast.updated'));
      setConfirm(null);
    } });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        {store.warehouses.map((warehouse) => (
          <div key={warehouse.id} className="card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-semibold text-primary">{warehouse.name}</p><p className="mt-1 text-sm text-muted">{warehouse.manager} · {warehouse.location}</p></div><span className={`badge ${statusTone(warehouse.active ? 'active' : 'inactive')}`}>{warehouse.active ? t('common.active') : t('common.inactive')}</span></div></div>
        ))}
      </section>

      <section className="card p-6">
        <div className={isRtl ? 'text-right' : ''}><h3 className="text-xl font-semibold text-primary">{t('pages.warehouses.title')}</h3><p className="mt-1 text-sm text-muted">{t('pages.warehouses.description')}</p></div>
        <form onSubmit={requestTransfer} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div><label className="label">{t('common.product')}</label><select className="input" value={form.productId} onChange={(e) => updateField('productId', e.target.value)}>{store.products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div><label className="label">{t('store.fromWarehouse')}</label><select className="input" value={form.from} onChange={(e) => updateField('from', e.target.value)}>{store.warehouses.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
          <div><label className="label">{t('store.toWarehouse')}</label><select className="input" value={form.to} onChange={(e) => updateField('to', e.target.value)}>{store.warehouses.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
          <div><label className="label">{t('common.quantity')}</label><input className="input" type="number" min="1" value={form.qty} onChange={(e) => updateField('qty', e.target.value)} /></div>
          <div className="flex items-end"><button type="submit" className="btn-primary w-full gap-2"><ArrowRightLeft className="h-4 w-4" />{t('store.createTransfer')}</button></div>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soft p-6"><h3 className="text-xl font-semibold text-primary">{t('store.transferHistory')}</h3><div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" /><input className="input ps-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('actions.searchPlaceholder')} /></div></div>
        <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="table-head"><tr><th className="px-5 py-4 font-medium">ID</th><th className="px-5 py-4 font-medium">{t('common.product')}</th><th className="px-5 py-4 font-medium">{t('store.fromWarehouse')}</th><th className="px-5 py-4 font-medium">{t('store.toWarehouse')}</th><th className="px-5 py-4 font-medium">{t('common.quantity')}</th><th className="px-5 py-4 font-medium">{t('common.status')}</th><th className="px-5 py-4 font-medium">{t('common.actions')}</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.id} className="border-b border-soft transition hover:bg-cyan-50 dark:hover:bg-white/5"><td className="px-5 py-4 font-medium text-primary">{row.id}</td><td className="px-5 py-4 text-muted">{row.productName}<br /><span className="text-xs text-soft">{formatDate(row.date, language)}</span></td><td className="px-5 py-4 text-muted">{row.from}</td><td className="px-5 py-4 text-muted">{row.to}</td><td className="px-5 py-4 text-muted">{row.qty}</td><td className="px-5 py-4"><span className={`badge ${statusTone(row.status === 'completed' ? 'active' : row.status === 'cancelled' ? 'inactive' : 'pending')}`}>{t(`store.${row.status}`)}</span></td><td className="px-5 py-4"><div className="flex flex-wrap gap-2">{row.status === 'pending' ? <><button type="button" onClick={() => setStatus(row, 'completed')} className="btn-primary !px-3 !py-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5" /> {t('store.complete')}</button><button type="button" onClick={() => setStatus(row, 'cancelled')} className="btn-danger !px-3 !py-2 text-xs"><XCircle className="h-3.5 w-3.5" /> {t('store.cancelTransfer')}</button></> : '—'}</div></td></tr>) : <tr><td colSpan="7" className="px-5 py-8"><EmptyState title={t('common.noData')} /></td></tr>}</tbody></table></div>
      </section>
      <ConfirmDialog open={Boolean(confirm)} title={confirm?.title} message={confirm?.message} variant={confirm?.variant} confirmText={confirm?.confirmText} onClose={() => setConfirm(null)} onConfirm={confirm?.onConfirm} />
    </div>
  );
}
