import { useMemo, useState } from 'react';
import { Edit3, PackagePlus, Search, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate, stockTone } from '../lib/utils';
import { makeId, productStatus, useStoreState } from '../lib/storeData';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

const emptyProduct = { name: '', barcode: '', category: '', warehouse: 'Main Warehouse', purchasePrice: '', salePrice: '', stock: '', minStock: 5, supplierId: '' };

export default function StoreProductsPage() {
  const { t, language, isRtl } = usePreferences();
  const toast = useToast();
  const [store, setStore] = useStoreState();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return store.products;
    return store.products.filter((item) => [item.name, item.barcode, item.category, item.warehouse].join(' ').toLowerCase().includes(term));
  }, [search, store.products]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function clearForm() {
    setForm(emptyProduct);
    setEditingId(null);
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({ ...product });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function requestSave(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.barcode.trim()) {
      toast.warning(t('toast.requiredFields'));
      return;
    }
    setConfirm({
      variant: 'info',
      title: editingId ? t('actions.confirmUpdate') : t('actions.confirmCreate'),
      message: editingId ? t('store.confirmUpdateProduct') : t('store.confirmCreateProduct'),
      confirmText: editingId ? t('actions.update') : t('actions.create'),
      onConfirm: saveProduct,
    });
  }

  function saveProduct() {
    setStore((current) => {
      const payload = {
        ...form,
        id: editingId || makeId('prd'),
        purchasePrice: Number(form.purchasePrice || 0),
        salePrice: Number(form.salePrice || 0),
        stock: Number(form.stock || 0),
        minStock: Number(form.minStock || 0),
        lastUpdated: new Date().toISOString(),
      };
      return {
        ...current,
        products: editingId ? current.products.map((item) => (item.id === editingId ? payload : item)) : [payload, ...current.products],
      };
    });
    toast.success(editingId ? t('toast.updated') : t('toast.created'));
    clearForm();
    setConfirm(null);
  }

  function requestDelete(product) {
    setConfirm({
      variant: 'danger',
      title: t('actions.confirmDeleteTitle'),
      message: `${t('actions.confirmDelete')} ${product.name}?`,
      confirmText: t('actions.delete'),
      onConfirm: () => deleteProduct(product.id),
    });
  }

  function deleteProduct(id) {
    setStore((current) => ({ ...current, products: current.products.filter((item) => item.id !== id) }));
    toast.success(t('toast.deleted'));
    setConfirm(null);
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={isRtl ? 'text-right' : ''}>
            <h3 className="text-xl font-semibold text-primary">{t('pages.storeProducts.title')}</h3>
            <p className="mt-1 text-sm text-muted">{t('pages.storeProducts.description')}</p>
          </div>
          <span className="badge border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200">{filteredProducts.length} {t('common.returnedRows')}</span>
        </div>

        <form onSubmit={requestSave} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div><label className="label">{t('common.product')}</label><input className="input" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder={t('store.productNamePlaceholder')} /></div>
          <div><label className="label">{t('common.barcode')}</label><input className="input" value={form.barcode} onChange={(e) => updateField('barcode', e.target.value)} placeholder="622..." /></div>
          <div><label className="label">{t('common.category')}</label><select className="input" value={form.category} onChange={(e) => updateField('category', e.target.value)}><option value="">{t('actions.select')}</option>{store.categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
          <div><label className="label">{t('common.warehouse')}</label><select className="input" value={form.warehouse} onChange={(e) => updateField('warehouse', e.target.value)}>{store.warehouses.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></div>
          <div><label className="label">{t('store.purchasePrice')}</label><input className="input" type="number" min="0" value={form.purchasePrice} onChange={(e) => updateField('purchasePrice', e.target.value)} /></div>
          <div><label className="label">{t('store.salePrice')}</label><input className="input" type="number" min="0" value={form.salePrice} onChange={(e) => updateField('salePrice', e.target.value)} /></div>
          <div><label className="label">{t('common.quantity')}</label><input className="input" type="number" min="0" value={form.stock} onChange={(e) => updateField('stock', e.target.value)} /></div>
          <div><label className="label">{t('store.minimumStock')}</label><input className="input" type="number" min="0" value={form.minStock} onChange={(e) => updateField('minStock', e.target.value)} /></div>
          <div className="md:col-span-2 xl:col-span-4 flex flex-wrap gap-3">
            <button type="submit" className="btn-primary gap-2"><PackagePlus className="h-4 w-4" />{editingId ? t('actions.update') : t('actions.create')}</button>
            {editingId ? <button type="button" onClick={clearForm} className="btn-secondary">{t('actions.cancel')}</button> : null}
          </div>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soft p-6">
          <h3 className="text-xl font-semibold text-primary">{t('store.productsInventory')}</h3>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" />
            <input className="input ps-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('actions.searchPlaceholder')} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.product')}</th><th className="px-5 py-4 font-medium">{t('common.barcode')}</th><th className="px-5 py-4 font-medium">{t('common.category')}</th><th className="px-5 py-4 font-medium">{t('store.salePrice')}</th><th className="px-5 py-4 font-medium">{t('common.quantity')}</th><th className="px-5 py-4 font-medium">{t('common.status')}</th><th className="px-5 py-4 font-medium">{t('common.lastUpdated')}</th><th className="px-5 py-4 font-medium">{t('common.actions')}</th></tr></thead>
            <tbody>
              {filteredProducts.length ? filteredProducts.map((product) => {
                const status = productStatus(product);
                return (
                  <tr key={product.id} className="border-b border-soft transition hover:bg-cyan-50 dark:hover:bg-white/5">
                    <td className="px-5 py-4 font-medium text-primary">{product.name}</td>
                    <td className="px-5 py-4 text-muted">{product.barcode}</td>
                    <td className="px-5 py-4 text-muted">{product.category || '—'}</td>
                    <td className="px-5 py-4 text-muted">{formatCurrency(product.salePrice, language)}</td>
                    <td className="px-5 py-4 text-muted">{product.stock} / {product.minStock}</td>
                    <td className="px-5 py-4"><span className={`badge ${stockTone(status)}`}>{t(`stock.${status}`)}</span></td>
                    <td className="px-5 py-4 text-muted">{formatDate(product.lastUpdated, language)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => startEdit(product)} className="btn-secondary !px-3 !py-2 text-xs"><Edit3 className="h-3.5 w-3.5" /> {t('actions.edit')}</button>
                        <button type="button" onClick={() => requestDelete(product)} className="btn-danger !px-3 !py-2 text-xs"><Trash2 className="h-3.5 w-3.5" /> {t('actions.delete')}</button>
                      </div>
                    </td>
                  </tr>
                );
              }) : <tr><td colSpan="8" className="px-5 py-8"><EmptyState title={t('common.noData')} /></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog open={Boolean(confirm)} title={confirm?.title} message={confirm?.message} variant={confirm?.variant} confirmText={confirm?.confirmText} onClose={() => setConfirm(null)} onConfirm={confirm?.onConfirm} />
    </div>
  );
}
