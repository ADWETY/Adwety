import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Pencil, Plus, Printer, Search, Trash2, X } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Drawer from '../components/Drawer';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';
import { usePreferences } from '../context/PreferencesContext';
import { deleteJson, extractArray, getJson, putJson } from '../lib/api';
import { demoMedicines, demoPharmacies } from '../lib/demoData';
import { exportToCsv, formatCurrency, formatDate, printElementById, stockStatus, stockTone } from '../lib/utils';

const emptyFilters = { q: '', category: '', pharmacy: '', stock: '', form: '', minPrice: '', maxPrice: '', sortBy: 'name' };

export default function MedicinesPage() {
  const { t, language } = usePreferences();
  const toast = useToast();
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState(demoMedicines);
  const [pharmacies, setPharmacies] = useState(demoPharmacies);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [medicines, pharmacyResult] = await Promise.all([getJson('/medicines'), getJson('/pharmacies')]);
      setRows(extractArray(medicines, demoMedicines));
      setPharmacies(extractArray(pharmacyResult, demoPharmacies));
    } catch (_error) {
      setRows(demoMedicines); setPharmacies(demoPharmacies);
    } finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  const categories = useMemo(() => Array.from(new Set(rows.map((item) => item.category).filter(Boolean))).sort(), [rows]);
  const forms = useMemo(() => Array.from(new Set(rows.map((item) => item.form).filter(Boolean))).sort(), [rows]);
  const filteredRows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    const min = filters.minPrice === '' ? null : Number(filters.minPrice);
    const max = filters.maxPrice === '' ? null : Number(filters.maxPrice);
    return rows.filter((item) => {
      const text = `${item.name} ${item.category} ${item.pharmacy_name} ${item.form} ${item.strength}`.toLowerCase();
      if (q && !text.includes(q)) return false;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.pharmacy && String(item.pharmacy_id || item.pharmacy_name) !== filters.pharmacy) return false;
      if (filters.stock && stockStatus(item.quantity) !== filters.stock) return false;
      if (filters.form && item.form !== filters.form) return false;
      if (min !== null && Number(item.price || 0) < min) return false;
      if (max !== null && Number(item.price || 0) > max) return false;
      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price') return Number(a.price || 0) - Number(b.price || 0);
      if (filters.sortBy === 'quantity') return Number(a.quantity || 0) - Number(b.quantity || 0);
      if (filters.sortBy === 'updated') return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [rows, filters]);

  function openEdit(item) { setEditing({ ...item, price: String(item.price || 0), quantity: String(item.quantity || 0), pharmacy_id: item.pharmacy_id || pharmacies[0]?.id || '' }); }
  async function saveEdit(event) {
    event.preventDefault(); setSaving(true);
    try {
      const payload = { ...editing, price: Number(editing.price || 0), quantity: Number(editing.quantity || 0) };
      await putJson(`/medicines/${editing.id}`, payload);
      setRows((current) => current.map((row) => (row.inventory_id === editing.inventory_id || row.id === editing.id ? { ...row, ...payload, pharmacy_name: pharmacies.find((p) => p.id === payload.pharmacy_id)?.name || row.pharmacy_name, updated_at: new Date().toISOString() } : row)));
      setEditing(null); toast.success(t('toast.updated'));
    } catch (error) { toast.error(error.message || t('toast.failed')); } finally { setSaving(false); }
  }
  function requestDelete(item) { setConfirm(item); }
  async function deleteRow() {
    const item = confirm; setConfirm(null);
    try { await deleteJson(`/medicines/${item.id}${item.inventory_id ? `?inventory_id=${item.inventory_id}` : ''}`); } catch (_error) {}
    setRows((current) => current.filter((row) => row.inventory_id !== item.inventory_id && row.id !== item.id));
    setSelected(null); toast.success(t('toast.deleted'));
  }
  function updateFilter(key, value) { setFilters((current) => ({ ...current, [key]: value })); }
  function exportRows() { if (exportToCsv('adwety-medicines.csv', filteredRows)) toast.success(t('toast.exported')); }

  const stats = { total: filteredRows.length, low: filteredRows.filter((item) => stockStatus(item.quantity) === 'low_stock').length, out: filteredRows.filter((item) => stockStatus(item.quantity) === 'out_of_stock').length };

  return <div className="space-y-6">
    <section className="card p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="xl:col-span-2"><label className="label">{t('actions.search')}</label><div className="relative"><Search className="pointer-events-none absolute start-4 top-3.5 h-4 w-4 text-soft" /><input className="input ps-11" value={filters.q} onChange={(e) => updateFilter('q', e.target.value)} placeholder={t('forms.medicineNamePlaceholder')} /></div></div>
        <div><label className="label">{t('common.category')}</label><select className="input" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}><option value="">{t('common.all')}</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
        <div><label className="label">{t('common.pharmacy')}</label><select className="input" value={filters.pharmacy} onChange={(e) => updateFilter('pharmacy', e.target.value)}><option value="">{t('common.all')}</option>{pharmacies.map((pharmacy) => <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>)}</select></div>
        <div><label className="label">{t('common.stock')}</label><select className="input" value={filters.stock} onChange={(e) => updateFilter('stock', e.target.value)}><option value="">{t('common.all')}</option><option value="in_stock">{t('stock.in_stock')}</option><option value="low_stock">{t('stock.low_stock')}</option><option value="out_of_stock">{t('stock.out_of_stock')}</option></select></div>
        <div><label className="label">{t('common.form')}</label><select className="input" value={filters.form} onChange={(e) => updateFilter('form', e.target.value)}><option value="">{t('common.all')}</option>{forms.map((form) => <option key={form}>{form}</option>)}</select></div>
        <div><label className="label">{t('common.minPrice')}</label><input className="input" type="number" min="0" value={filters.minPrice} onChange={(e) => updateFilter('minPrice', e.target.value)} /></div>
        <div><label className="label">{t('common.maxPrice')}</label><input className="input" type="number" min="0" value={filters.maxPrice} onChange={(e) => updateFilter('maxPrice', e.target.value)} /></div>
        <div><label className="label">{t('common.sortBy')}</label><select className="input" value={filters.sortBy} onChange={(e) => updateFilter('sortBy', e.target.value)}><option value="name">{t('common.name')}</option><option value="price">{t('common.price')}</option><option value="quantity">{t('common.quantity')}</option><option value="updated">{t('common.lastUpdated')}</option></select></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3"><span className="badge border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{t('common.returnedRows')}: {stats.total}</span><span className={`badge ${stockTone('low_stock')}`}>{t('stock.low_stock')}: {stats.low}</span><span className={`badge ${stockTone('out_of_stock')}`}>{t('stock.out_of_stock')}: {stats.out}</span><button type="button" className="btn-secondary gap-2" onClick={() => setFilters(emptyFilters)}><X className="h-4 w-4" />{t('actions.reset')}</button><button type="button" className="btn-secondary gap-2" onClick={exportRows}><Download className="h-4 w-4" />{t('actions.exportCsv')}</button><button type="button" className="btn-secondary gap-2" onClick={() => printElementById('medicines-table', 'ADWETY Medicines')}><Printer className="h-4 w-4" />{t('actions.print')}</button><Link to="/medicines/new" className="btn-primary ms-auto gap-2"><Plus className="h-4 w-4" />{t('nav.addMedicine')}</Link></div>
    </section>
    {loading ? <TableSkeleton /> : !filteredRows.length ? <EmptyState title={t('common.noData')} description={language === 'ar' ? 'لا توجد أدوية مطابقة' : 'No medicines found'} action={<Link className="btn-primary" to="/medicines/new">{t('nav.addMedicine')}</Link>} /> : <section id="medicines-table" className="card overflow-hidden"><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.medicine')}</th><th className="px-5 py-4 font-medium">{t('common.category')}</th><th className="px-5 py-4 font-medium">{t('common.pharmacy')}</th><th className="px-5 py-4 font-medium">{t('common.price')}</th><th className="px-5 py-4 font-medium">{t('common.quantity')}</th><th className="px-5 py-4 font-medium">{t('common.stock')}</th><th className="px-5 py-4 font-medium no-print">{t('common.actions')}</th></tr></thead><tbody>{filteredRows.map((item) => <tr key={item.inventory_id || item.id} className="border-b border-soft"><td className="px-5 py-4"><p className="font-medium text-primary">{item.name}</p><p className="mt-1 text-xs text-muted">{item.strength} · {item.form}</p></td><td className="px-5 py-4 text-muted">{item.category}</td><td className="px-5 py-4 text-muted">{item.pharmacy_name || '—'}</td><td className="px-5 py-4 text-muted">{formatCurrency(item.price, language)}</td><td className="px-5 py-4 text-muted">{item.quantity}</td><td className="px-5 py-4"><span className={`badge ${stockTone(item.quantity)}`}>{t(`stock.${stockStatus(item.quantity)}`)}</span></td><td className="px-5 py-4 no-print"><div className="flex flex-wrap gap-2"><button className="btn-secondary !px-3 !py-2" onClick={() => setSelected(item)}><Eye className="h-4 w-4" /></button><button className="btn-secondary !px-3 !py-2" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></button><button className="btn-danger !px-3 !py-2" onClick={() => requestDelete(item)}><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div></section>}
    <Drawer open={Boolean(selected)} title={t('actions.viewDetails')} onClose={() => setSelected(null)}>{selected ? <div className="space-y-4"><div className="sub-card p-4"><p className="text-2xl font-semibold text-primary">{selected.name}</p><p className="mt-2 text-sm text-muted">{selected.description}</p></div>{[['common.category', selected.category], ['common.strength', selected.strength], ['common.form', selected.form], ['common.price', formatCurrency(selected.price, language)], ['common.quantity', selected.quantity], ['common.pharmacy', selected.pharmacy_name], ['common.lastUpdated', formatDate(selected.updated_at, language)]].map(([key, value]) => <div key={key} className="flex justify-between gap-4 border-b border-soft pb-3"><span className="text-sm text-muted">{t(key)}</span><span className="font-medium text-primary">{value || '—'}</span></div>)}<span className={`badge ${stockTone(selected.quantity)}`}>{t(`stock.${stockStatus(selected.quantity)}`)}</span><div className="flex gap-3 pt-4"><button className="btn-secondary" onClick={() => openEdit(selected)}>{t('actions.edit')}</button><button className="btn-danger" onClick={() => requestDelete(selected)}>{t('actions.delete')}</button></div></div> : null}</Drawer>
    {editing ? <div className="fixed inset-0 z-[62] bg-slate-950/40 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}><form className="card mx-auto max-h-full w-full max-w-3xl overflow-y-auto p-6" onSubmit={saveEdit} onClick={(e) => e.stopPropagation()}><div className="flex items-start justify-between gap-3"><h3 className="text-2xl font-semibold text-primary">{t('actions.edit')} {t('common.medicine')}</h3><button type="button" className="btn-secondary !p-3" onClick={() => setEditing(null)}><X className="h-4 w-4" /></button></div><div className="mt-6 grid gap-5 md:grid-cols-2">{['name','category','strength','form','price','quantity'].map((field) => <div key={field}><label className="label">{t(field === 'name' ? 'common.name' : field === 'price' ? 'common.price' : field === 'quantity' ? 'common.quantity' : field === 'category' ? 'common.category' : field === 'strength' ? 'common.strength' : 'common.form')}</label><input className="input" type={field === 'price' || field === 'quantity' ? 'number' : 'text'} value={editing[field] || ''} onChange={(e) => setEditing((c) => ({ ...c, [field]: e.target.value }))} /></div>)}<div><label className="label">{t('common.pharmacy')}</label><select className="input" value={editing.pharmacy_id || ''} onChange={(e) => setEditing((c) => ({ ...c, pharmacy_id: e.target.value }))}>{pharmacies.map((pharmacy) => <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>)}</select></div><div className="md:col-span-2"><label className="label">{t('common.description')}</label><textarea className="input min-h-28" value={editing.description || ''} onChange={(e) => setEditing((c) => ({ ...c, description: e.target.value }))} /></div></div><div className="mt-6 flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>{t('actions.cancel')}</button><button className="btn-primary" disabled={saving}>{saving ? t('app.loading') : t('actions.save')}</button></div></form></div> : null}
    <ConfirmDialog open={Boolean(confirm)} title={t('actions.delete')} message={confirm ? `${t('actions.confirmDelete')} ${confirm.name}` : ''} onClose={() => setConfirm(null)} onConfirm={deleteRow} />
  </div>;
}
