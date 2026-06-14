import { useMemo, useState } from 'react';
import { Download, Printer, Search } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { exportToCsv, formatCurrency, formatDate, printElementById, stockTone } from '../lib/utils';
import { filterByDate, invoiceProfit, invoiceTotal, productStatus, useStoreState } from '../lib/storeData';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

function today() { return new Date().toISOString().slice(0, 10); }
function weekAgo() { const date = new Date(); date.setDate(date.getDate() - 7); return date.toISOString().slice(0, 10); }

export default function StoreReportsPage() {
  const { t, language, isRtl } = usePreferences();
  const toast = useToast();
  const [store] = useStoreState();
  const [fromDate, setFromDate] = useState(weekAgo());
  const [toDate, setToDate] = useState(today());
  const [search, setSearch] = useState('');

  const invoices = useMemo(() => filterByDate(store.invoices, fromDate, toDate), [store.invoices, fromDate, toDate]);
  const returns = useMemo(() => filterByDate(store.returns, fromDate, toDate), [store.returns, fromDate, toDate]);
  const treasury = useMemo(() => filterByDate(store.treasury, fromDate, toDate), [store.treasury, fromDate, toDate]);
  const sales = invoices.reduce((sum, item) => sum + invoiceTotal(item), 0);
  const profit = invoices.reduce((sum, item) => sum + invoiceProfit(item), 0);
  const returnsAmount = returns.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenses = treasury.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const stockValue = store.products.reduce((sum, item) => sum + Number(item.stock || 0) * Number(item.purchasePrice || 0), 0);

  const topProducts = useMemo(() => {
    const map = invoices.flatMap((invoice) => invoice.items || []).reduce((acc, item) => {
      acc[item.productId] = acc[item.productId] || { name: item.name, qty: 0, total: 0 };
      acc[item.productId].qty += Number(item.qty || 0);
      acc[item.productId].total += Number(item.qty || 0) * Number(item.price || 0);
      return acc;
    }, {});
    const term = search.trim().toLowerCase();
    return Object.values(map).filter((item) => item.name.toLowerCase().includes(term)).sort((a, b) => b.total - a.total);
  }, [invoices, search]);

  function exportReport() {
    const ok = exportToCsv('store-dashboard-report.csv', topProducts.length ? topProducts : [{ name: t('common.noData'), qty: 0, total: 0 }]);
    toast[ok ? 'success' : 'warning'](ok ? t('toast.exported') : t('common.noData'));
  }

  return (
    <div className="space-y-6" id="reports-print-area">
      <section className="card p-6 no-print">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className={isRtl ? 'text-right' : ''}><h3 className="text-xl font-semibold text-primary">{t('pages.reports.title')}</h3><p className="mt-1 text-sm text-muted">{t('pages.reports.description')}</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" className="btn-secondary gap-2" onClick={exportReport}><Download className="h-4 w-4" />{t('actions.export')}</button><button type="button" className="btn-secondary gap-2" onClick={() => printElementById('reports-print-area', t('reports.printTitle'))}><Printer className="h-4 w-4" />{t('actions.print')}</button></div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div><label className="label">{t('store.fromDate')}</label><input className="input" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></div>
          <div><label className="label">{t('store.toDate')}</label><input className="input" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></div>
          <div><label className="label">{t('actions.search')}</label><div className="relative"><Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" /><input className="input ps-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('actions.searchPlaceholder')} /></div></div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="card p-5"><p className="text-sm text-muted">{t('dashboard.todaySales')}</p><p className="mt-2 text-2xl font-bold text-primary">{formatCurrency(sales, language)}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">{t('dashboard.netProfit')}</p><p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(profit, language)}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">{t('nav.returns')}</p><p className="mt-2 text-2xl font-bold text-rose-600">{formatCurrency(returnsAmount, language)}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">{t('store.totalExpenses')}</p><p className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(expenses, language)}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">{t('store.stockValue')}</p><p className="mt-2 text-2xl font-bold text-primary">{formatCurrency(stockValue, language)}</p></div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-soft p-6"><h3 className="text-xl font-semibold text-primary">{t('store.topProducts')}</h3><p className="mt-1 text-sm text-muted">{t('store.reportPeriod')}: {fromDate} → {toDate}</p></div>
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.product')}</th><th className="px-5 py-4 font-medium">{t('common.quantity')}</th><th className="px-5 py-4 font-medium">{t('common.total')}</th></tr></thead><tbody>{topProducts.length ? topProducts.map((item) => <tr key={item.name} className="border-b border-soft"><td className="px-5 py-4 font-medium text-primary">{item.name}</td><td className="px-5 py-4 text-muted">{item.qty}</td><td className="px-5 py-4 text-muted">{formatCurrency(item.total, language)}</td></tr>) : <tr><td colSpan="3" className="px-5 py-8"><EmptyState title={t('common.noData')} /></td></tr>}</tbody></table></div>
        </div>
        <div className="card overflow-hidden">
          <div className="border-b border-soft p-6"><h3 className="text-xl font-semibold text-primary">{t('dashboard.lowStockTable')}</h3></div>
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.product')}</th><th className="px-5 py-4 font-medium">{t('common.quantity')}</th><th className="px-5 py-4 font-medium">{t('common.status')}</th></tr></thead><tbody>{store.products.filter((item) => productStatus(item) !== 'in_stock').map((item) => <tr key={item.id} className="border-b border-soft"><td className="px-5 py-4 font-medium text-primary">{item.name}</td><td className="px-5 py-4 text-muted">{item.stock}</td><td className="px-5 py-4"><span className={`badge ${stockTone(productStatus(item))}`}>{t(`stock.${productStatus(item)}`)}</span></td></tr>)}</tbody></table></div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-soft p-6"><h3 className="text-xl font-semibold text-primary">{t('store.invoiceReport')}</h3></div>
        <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('store.invoiceNumber')}</th><th className="px-5 py-4 font-medium">{t('nav.customers')}</th><th className="px-5 py-4 font-medium">{t('common.total')}</th><th className="px-5 py-4 font-medium">{t('dashboard.profit')}</th><th className="px-5 py-4 font-medium">{t('common.lastUpdated')}</th></tr></thead><tbody>{invoices.length ? invoices.map((invoice) => <tr key={invoice.id} className="border-b border-soft"><td className="px-5 py-4 font-medium text-primary">{invoice.number}</td><td className="px-5 py-4 text-muted">{invoice.customerName}</td><td className="px-5 py-4 text-muted">{formatCurrency(invoiceTotal(invoice), language)}</td><td className="px-5 py-4 text-muted">{formatCurrency(invoiceProfit(invoice), language)}</td><td className="px-5 py-4 text-muted">{formatDate(invoice.date, language)}</td></tr>) : <tr><td colSpan="5" className="px-5 py-8"><EmptyState title={t('common.noData')} /></td></tr>}</tbody></table></div>
      </section>
    </div>
  );
}
