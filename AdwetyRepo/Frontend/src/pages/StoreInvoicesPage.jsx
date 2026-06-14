import { useMemo, useState } from 'react';
import { Eye, Search, Wallet } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate, statusTone } from '../lib/utils';
import { invoiceProfit, invoiceTotal, useStoreState } from '../lib/storeData';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

export default function StoreInvoicesPage() {
  const { t, language, isRtl } = usePreferences();
  const toast = useToast();
  const [store, setStore] = useStoreState();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const invoices = [...store.invoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!term) return invoices;
    return invoices.filter((item) => [item.number, item.customerName, item.status].join(' ').toLowerCase().includes(term));
  }, [search, store.invoices]);

  function requestMarkPaid(invoice) {
    setConfirm({
      variant: 'info',
      title: t('store.confirmMarkPaidTitle'),
      message: `${t('store.confirmMarkPaid')} ${invoice.number}?`,
      confirmText: t('store.markPaid'),
      onConfirm: () => {
        setStore((current) => ({ ...current, invoices: current.invoices.map((item) => (item.id === invoice.id ? { ...item, status: 'paid', paid: invoiceTotal(item) } : item)) }));
        toast.success(t('toast.updated'));
        setConfirm(null);
      },
    });
  }

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soft p-6">
          <div className={isRtl ? 'text-right' : ''}><h3 className="text-xl font-semibold text-primary">{t('pages.invoices.title')}</h3><p className="mt-1 text-sm text-muted">{t('pages.invoices.description')}</p></div>
          <div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" /><input className="input ps-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('actions.searchPlaceholder')} /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('store.invoiceNumber')}</th><th className="px-5 py-4 font-medium">{t('nav.customers')}</th><th className="px-5 py-4 font-medium">{t('common.total')}</th><th className="px-5 py-4 font-medium">{t('dashboard.profit')}</th><th className="px-5 py-4 font-medium">{t('common.status')}</th><th className="px-5 py-4 font-medium">{t('common.lastUpdated')}</th><th className="px-5 py-4 font-medium">{t('common.actions')}</th></tr></thead>
            <tbody>
              {rows.length ? rows.map((invoice) => (
                <tr key={invoice.id} className="border-b border-soft transition hover:bg-cyan-50 dark:hover:bg-white/5">
                  <td className="px-5 py-4 font-medium text-primary">{invoice.number}</td>
                  <td className="px-5 py-4 text-muted">{invoice.customerName}</td>
                  <td className="px-5 py-4 text-muted">{formatCurrency(invoiceTotal(invoice), language)}</td>
                  <td className="px-5 py-4 text-muted">{formatCurrency(invoiceProfit(invoice), language)}</td>
                  <td className="px-5 py-4"><span className={`badge ${statusTone(invoice.status === 'paid' ? 'active' : 'pending')}`}>{t(`store.${invoice.status}`)}</span></td>
                  <td className="px-5 py-4 text-muted">{formatDate(invoice.date, language)}</td>
                  <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSelected(invoice)} className="btn-secondary !px-3 !py-2 text-xs"><Eye className="h-3.5 w-3.5" /> {t('actions.viewDetails')}</button>{invoice.status !== 'paid' ? <button type="button" onClick={() => requestMarkPaid(invoice)} className="btn-primary !px-3 !py-2 text-xs"><Wallet className="h-3.5 w-3.5" /> {t('store.markPaid')}</button> : null}</div></td>
                </tr>
              )) : <tr><td colSpan="7" className="px-5 py-8"><EmptyState title={t('common.noData')} /></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="card w-full max-w-3xl p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-semibold text-primary">{selected.number}</h3><p className="mt-1 text-sm text-muted">{selected.customerName} · {formatDate(selected.date, language)}</p></div><button type="button" onClick={() => setSelected(null)} className="btn-secondary !py-2">{t('actions.close')}</button></div>
            <div className="mt-5 overflow-x-auto rounded-3xl border border-soft">
              <table className="min-w-full text-sm"><thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.product')}</th><th className="px-5 py-4 font-medium">{t('common.quantity')}</th><th className="px-5 py-4 font-medium">{t('common.price')}</th><th className="px-5 py-4 font-medium">{t('common.total')}</th></tr></thead><tbody>{selected.items.map((line) => <tr key={line.productId} className="border-b border-soft"><td className="px-5 py-4 font-medium text-primary">{line.name}</td><td className="px-5 py-4 text-muted">{line.qty}</td><td className="px-5 py-4 text-muted">{formatCurrency(line.price, language)}</td><td className="px-5 py-4 text-muted">{formatCurrency(line.qty * line.price, language)}</td></tr>)}</tbody></table>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3"><div className="sub-card p-4"><p className="text-xs text-muted">{t('store.discount')}</p><p className="mt-1 font-semibold text-primary">{formatCurrency(selected.discount, language)}</p></div><div className="sub-card p-4"><p className="text-xs text-muted">{t('common.total')}</p><p className="mt-1 font-semibold text-primary">{formatCurrency(invoiceTotal(selected), language)}</p></div><div className="sub-card p-4"><p className="text-xs text-muted">{t('dashboard.profit')}</p><p className="mt-1 font-semibold text-primary">{formatCurrency(invoiceProfit(selected), language)}</p></div></div>
          </div>
        </div>
      ) : null}
      <ConfirmDialog open={Boolean(confirm)} title={confirm?.title} message={confirm?.message} variant={confirm?.variant} confirmText={confirm?.confirmText} onClose={() => setConfirm(null)} onConfirm={confirm?.onConfirm} />
    </div>
  );
}
