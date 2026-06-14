import { useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate } from '../lib/utils';
import { invoiceTotal, makeId, useStoreState } from '../lib/storeData';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

export default function StoreReturnsPage() {
  const { t, language, isRtl } = usePreferences();
  const toast = useToast();
  const [store, setStore] = useStoreState();
  const [invoiceId, setInvoiceId] = useState(store.invoices[0]?.id || '');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('');
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);

  const selectedInvoice = store.invoices.find((item) => item.id === invoiceId);
  const selectedLine = selectedInvoice?.items.find((item) => item.productId === productId) || selectedInvoice?.items[0];

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...store.returns].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!term) return sorted;
    return sorted.filter((item) => [item.invoiceNumber, item.productName, item.reason].join(' ').toLowerCase().includes(term));
  }, [search, store.returns]);

  function requestReturn(event) {
    event.preventDefault();
    if (!selectedInvoice || !selectedLine) { toast.warning(t('toast.requiredFields')); return; }
    setConfirm({
      variant: 'info',
      title: t('store.confirmReturnTitle'),
      message: `${t('store.confirmReturn')} ${selectedLine.name}?`,
      confirmText: t('nav.returns'),
      onConfirm: saveReturn,
    });
  }

  function saveReturn() {
    const quantity = Math.max(1, Number(qty || 1));
    const amount = quantity * Number(selectedLine.price || 0);
    const returnRow = { id: makeId('ret'), invoiceNumber: selectedInvoice.number, productName: selectedLine.name, qty: quantity, amount, reason, date: new Date().toISOString() };
    setStore((current) => ({
      ...current,
      products: current.products.map((product) => (product.id === selectedLine.productId ? { ...product, stock: Number(product.stock || 0) + quantity, lastUpdated: new Date().toISOString() } : product)),
      returns: [returnRow, ...current.returns],
      treasury: [{ id: makeId('trx'), type: 'expense', title: `${t('nav.returns')} ${selectedInvoice.number}`, amount, date: new Date().toISOString(), note: reason || selectedLine.name }, ...current.treasury],
    }));
    toast.success(t('store.returnSaved'));
    setQty(1);
    setReason('');
    setConfirm(null);
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className={isRtl ? 'text-right' : ''}><h3 className="text-xl font-semibold text-primary">{t('pages.returns.title')}</h3><p className="mt-1 text-sm text-muted">{t('pages.returns.description')}</p></div>
        <form onSubmit={requestReturn} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div><label className="label">{t('store.invoiceNumber')}</label><select className="input" value={invoiceId} onChange={(e) => { setInvoiceId(e.target.value); setProductId(''); }}>{store.invoices.map((item) => <option key={item.id} value={item.id}>{item.number} · {formatCurrency(invoiceTotal(item), language)}</option>)}</select></div>
          <div><label className="label">{t('common.product')}</label><select className="input" value={productId || selectedLine?.productId || ''} onChange={(e) => setProductId(e.target.value)}>{selectedInvoice?.items.map((item) => <option key={item.productId} value={item.productId}>{item.name}</option>)}</select></div>
          <div><label className="label">{t('common.quantity')}</label><input className="input" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} /></div>
          <div><label className="label">{t('store.returnReason')}</label><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          <div className="flex items-end"><button type="submit" className="btn-primary w-full gap-2"><RotateCcw className="h-4 w-4" />{t('store.saveReturn')}</button></div>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soft p-6"><h3 className="text-xl font-semibold text-primary">{t('store.returnHistory')}</h3><div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" /><input className="input ps-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('actions.searchPlaceholder')} /></div></div>
        <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('store.invoiceNumber')}</th><th className="px-5 py-4 font-medium">{t('common.product')}</th><th className="px-5 py-4 font-medium">{t('common.quantity')}</th><th className="px-5 py-4 font-medium">{t('common.total')}</th><th className="px-5 py-4 font-medium">{t('store.returnReason')}</th><th className="px-5 py-4 font-medium">{t('common.lastUpdated')}</th></tr></thead><tbody>{rows.length ? rows.map((item) => <tr key={item.id} className="border-b border-soft transition hover:bg-cyan-50 dark:hover:bg-white/5"><td className="px-5 py-4 font-medium text-primary">{item.invoiceNumber}</td><td className="px-5 py-4 text-muted">{item.productName}</td><td className="px-5 py-4 text-muted">{item.qty}</td><td className="px-5 py-4 text-muted">{formatCurrency(item.amount, language)}</td><td className="px-5 py-4 text-muted">{item.reason || '—'}</td><td className="px-5 py-4 text-muted">{formatDate(item.date, language)}</td></tr>) : <tr><td colSpan="6" className="px-5 py-8"><EmptyState title={t('common.noData')} /></td></tr>}</tbody></table></div>
      </section>
      <ConfirmDialog open={Boolean(confirm)} title={confirm?.title} message={confirm?.message} variant={confirm?.variant} confirmText={confirm?.confirmText} onClose={() => setConfirm(null)} onConfirm={confirm?.onConfirm} />
    </div>
  );
}
