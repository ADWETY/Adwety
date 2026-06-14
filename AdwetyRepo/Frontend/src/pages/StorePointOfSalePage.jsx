import { useMemo, useState } from 'react';
import { Minus, Plus, ReceiptText, Search, ShoppingCart, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { formatCurrency, stockTone } from '../lib/utils';
import { getEntityName, invoiceTotal, makeId, productStatus, useStoreState } from '../lib/storeData';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

export default function StorePointOfSalePage() {
  const { t, language, isRtl } = usePreferences();
  const toast = useToast();
  const [store, setStore] = useStoreState();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState(store.customers[0]?.id || '');
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [confirm, setConfirm] = useState(null);

  const products = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return store.products;
    return store.products.filter((item) => [item.name, item.barcode, item.category].join(' ').toLowerCase().includes(term));
  }, [search, store.products]);

  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  const total = Math.max(0, subtotal - Number(discount || 0));
  const change = Number(paid || 0) - total;

  function addToCart(product) {
    if (Number(product.stock || 0) <= 0) {
      toast.warning(t('store.outOfStockWarning'));
      return;
    }
    setConfirm({
      variant: 'info',
      title: t('actions.confirmAdd'),
      message: `${t('store.confirmAddToCart')} ${product.name}?`,
      confirmText: t('actions.add'),
      onConfirm: () => {
        setCart((current) => {
          const exists = current.find((item) => item.productId === product.id);
          if (exists) {
            if (exists.qty >= product.stock) return current;
            return current.map((item) => (item.productId === product.id ? { ...item, qty: item.qty + 1 } : item));
          }
          return [...current, { productId: product.id, name: product.name, barcode: product.barcode, qty: 1, price: Number(product.salePrice || 0), cost: Number(product.purchasePrice || 0) }];
        });
        toast.success(t('toast.added'));
        setConfirm(null);
      },
    });
  }

  function changeQty(productId, delta) {
    setCart((current) => current.map((item) => {
      if (item.productId !== productId) return item;
      const product = store.products.find((row) => row.id === productId);
      const next = Math.max(1, Math.min(Number(product?.stock || 1), item.qty + delta));
      return { ...item, qty: next };
    }));
  }

  function removeItem(productId) {
    setConfirm({
      variant: 'danger',
      title: t('actions.confirmDeleteTitle'),
      message: t('store.confirmRemoveCartItem'),
      confirmText: t('actions.delete'),
      onConfirm: () => {
        setCart((current) => current.filter((item) => item.productId !== productId));
        toast.success(t('toast.deleted'));
        setConfirm(null);
      },
    });
  }

  function requestCheckout() {
    if (!cart.length) { toast.warning(t('store.cartEmpty')); return; }
    setConfirm({
      variant: 'info',
      title: t('store.confirmCheckoutTitle'),
      message: `${t('store.confirmCheckout')} ${formatCurrency(total, language)}?`,
      confirmText: t('store.completeSale'),
      onConfirm: checkout,
    });
  }

  function checkout() {
    const number = `INV-${String(store.invoices.length + 1001).padStart(4, '0')}`;
    const customerName = getEntityName(store.customers, customerId, t('store.walkIn'));
    const invoice = { id: number, number, type: 'sale', customerId, customerName, date: new Date().toISOString(), status: Number(paid || 0) >= total ? 'paid' : 'partial', discount: Number(discount || 0), paid: Number(paid || 0), items: cart };
    setStore((current) => ({
      ...current,
      products: current.products.map((product) => {
        const line = cart.find((item) => item.productId === product.id);
        return line ? { ...product, stock: Math.max(0, Number(product.stock || 0) - line.qty), lastUpdated: new Date().toISOString() } : product;
      }),
      invoices: [invoice, ...current.invoices],
      treasury: [{ id: makeId('trx'), type: 'income', title: `${t('nav.pointOfSale')} ${number}`, amount: invoiceTotal(invoice), date: new Date().toISOString(), note: customerName }, ...current.treasury],
    }));
    setCart([]);
    setDiscount(0);
    setPaid(0);
    toast.success(t('store.saleCompleted'));
    setConfirm(null);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_430px]">
      <section className="card overflow-hidden">
        <div className="border-b border-soft p-6">
          <div className={isRtl ? 'text-right' : ''}>
            <h3 className="text-xl font-semibold text-primary">{t('pages.pointOfSale.title')}</h3>
            <p className="mt-1 text-sm text-muted">{t('pages.pointOfSale.description')}</p>
          </div>
          <div className="relative mt-5"><Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" /><input className="input ps-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('store.scanOrSearch')} /></div>
        </div>
        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
          {products.length ? products.map((product) => {
            const status = productStatus(product);
            return (
              <button type="button" key={product.id} onClick={() => addToCart(product)} className="sub-card p-4 text-start transition hover:-translate-y-1 hover:border-cyan-300">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-primary">{product.name}</p>
                    <p className="mt-1 text-xs text-muted">{product.barcode}</p>
                  </div>
                  <span className={`badge ${stockTone(status)}`}>{product.stock}</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">{product.category}</span>
                  <span className="font-bold text-primary">{formatCurrency(product.salePrice, language)}</span>
                </div>
              </button>
            );
          }) : <div className="md:col-span-2 xl:col-span-3"><EmptyState title={t('common.noData')} /></div>}
        </div>
      </section>

      <aside className="card h-fit overflow-hidden">
        <div className="border-b border-soft p-6">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-primary"><ShoppingCart className="h-5 w-5" /> {t('store.currentInvoice')}</h3>
          <div className="mt-4"><label className="label">{t('nav.customers')}</label><select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>{store.customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
        </div>
        <div className="max-h-[360px] space-y-3 overflow-y-auto p-6">
          {cart.length ? cart.map((item) => (
            <div key={item.productId} className="sub-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-medium text-primary">{item.name}</p><p className="mt-1 text-xs text-muted">{formatCurrency(item.price, language)} × {item.qty}</p></div>
                <button type="button" onClick={() => removeItem(item.productId)} className="btn-danger !p-2"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><button type="button" onClick={() => changeQty(item.productId, -1)} className="btn-secondary !p-2"><Minus className="h-4 w-4" /></button><span className="badge border-soft text-primary">{item.qty}</span><button type="button" onClick={() => changeQty(item.productId, 1)} className="btn-secondary !p-2"><Plus className="h-4 w-4" /></button></div>
                <span className="font-semibold text-primary">{formatCurrency(item.qty * item.price, language)}</span>
              </div>
            </div>
          )) : <EmptyState title={t('store.cartEmpty')} />}
        </div>
        <div className="border-t border-soft p-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            <div><label className="label">{t('store.discount')}</label><input className="input" type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
            <div><label className="label">{t('store.paid')}</label><input className="input" type="number" min="0" value={paid} onChange={(e) => setPaid(e.target.value)} /></div>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">{t('store.subtotal')}</span><span className="font-medium text-primary">{formatCurrency(subtotal, language)}</span></div>
            <div className="flex justify-between"><span className="text-muted">{t('common.total')}</span><span className="text-xl font-bold text-primary">{formatCurrency(total, language)}</span></div>
            <div className="flex justify-between"><span className="text-muted">{t('store.change')}</span><span className={change >= 0 ? 'font-medium text-emerald-600' : 'font-medium text-rose-600'}>{formatCurrency(change, language)}</span></div>
          </div>
          <button type="button" onClick={requestCheckout} className="btn-primary mt-5 w-full gap-2"><ReceiptText className="h-4 w-4" />{t('store.completeSale')}</button>
        </div>
      </aside>

      <ConfirmDialog open={Boolean(confirm)} title={confirm?.title} message={confirm?.message} variant={confirm?.variant} confirmText={confirm?.confirmText} onClose={() => setConfirm(null)} onConfirm={confirm?.onConfirm} />
    </div>
  );
}
