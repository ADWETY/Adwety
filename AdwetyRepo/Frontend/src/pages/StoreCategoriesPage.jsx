import { useMemo, useState } from 'react';
import { Edit3, Search, Tags, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { makeId, useStoreState } from '../lib/storeData';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

const emptyCategory = { name: '', description: '', active: true };

export default function StoreCategoriesPage() {
  const { t, isRtl } = usePreferences();
  const toast = useToast();
  const [store, setStore] = useStoreState();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyCategory);
  const [editingId, setEditingId] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return store.categories;
    return store.categories.filter((item) => [item.name, item.description].join(' ').toLowerCase().includes(term));
  }, [search, store.categories]);

  function updateField(name, value) { setForm((current) => ({ ...current, [name]: value })); }
  function clearForm() { setForm(emptyCategory); setEditingId(null); }
  function startEdit(category) { setForm(category); setEditingId(category.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  function requestSave(event) {
    event.preventDefault();
    if (!form.name.trim()) { toast.warning(t('toast.requiredFields')); return; }
    setConfirm({
      variant: 'info',
      title: editingId ? t('actions.confirmUpdate') : t('actions.confirmCreate'),
      message: editingId ? t('store.confirmUpdateCategory') : t('store.confirmCreateCategory'),
      confirmText: editingId ? t('actions.update') : t('actions.create'),
      onConfirm: saveCategory,
    });
  }

  function saveCategory() {
    setStore((current) => {
      const payload = { ...form, id: editingId || makeId('cat') };
      return { ...current, categories: editingId ? current.categories.map((item) => (item.id === editingId ? payload : item)) : [payload, ...current.categories] };
    });
    toast.success(editingId ? t('toast.updated') : t('toast.created'));
    clearForm();
    setConfirm(null);
  }

  function requestDelete(category) {
    setConfirm({
      variant: 'danger',
      title: t('actions.confirmDeleteTitle'),
      message: `${t('actions.confirmDelete')} ${category.name}?`,
      confirmText: t('actions.delete'),
      onConfirm: () => deleteCategory(category.id),
    });
  }

  function deleteCategory(id) {
    setStore((current) => ({ ...current, categories: current.categories.filter((item) => item.id !== id) }));
    toast.success(t('toast.deleted'));
    setConfirm(null);
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className={isRtl ? 'text-right' : ''}>
          <h3 className="text-xl font-semibold text-primary">{t('pages.categories.title')}</h3>
          <p className="mt-1 text-sm text-muted">{t('pages.categories.description')}</p>
        </div>
        <form onSubmit={requestSave} className="mt-6 grid gap-4 md:grid-cols-[1fr_1.5fr_auto] md:items-end">
          <div><label className="label">{t('common.category')}</label><input className="input" value={form.name} onChange={(e) => updateField('name', e.target.value)} /></div>
          <div><label className="label">{t('common.description')}</label><input className="input" value={form.description} onChange={(e) => updateField('description', e.target.value)} /></div>
          <div className="flex gap-3"><button type="submit" className="btn-primary gap-2"><Tags className="h-4 w-4" />{editingId ? t('actions.update') : t('actions.create')}</button>{editingId ? <button type="button" className="btn-secondary" onClick={clearForm}>{t('actions.cancel')}</button> : null}</div>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soft p-6">
          <h3 className="text-xl font-semibold text-primary">{t('store.categoryList')}</h3>
          <div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" /><input className="input ps-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('actions.searchPlaceholder')} /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.category')}</th><th className="px-5 py-4 font-medium">{t('common.description')}</th><th className="px-5 py-4 font-medium">{t('common.status')}</th><th className="px-5 py-4 font-medium">{t('common.actions')}</th></tr></thead>
            <tbody>
              {rows.length ? rows.map((category) => (
                <tr key={category.id} className="border-b border-soft transition hover:bg-cyan-50 dark:hover:bg-white/5">
                  <td className="px-5 py-4 font-medium text-primary">{category.name}</td>
                  <td className="px-5 py-4 text-muted">{category.description || '—'}</td>
                  <td className="px-5 py-4"><span className="badge border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">{category.active ? t('common.active') : t('common.inactive')}</span></td>
                  <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => startEdit(category)} className="btn-secondary !px-3 !py-2 text-xs"><Edit3 className="h-3.5 w-3.5" /> {t('actions.edit')}</button><button type="button" onClick={() => requestDelete(category)} className="btn-danger !px-3 !py-2 text-xs"><Trash2 className="h-3.5 w-3.5" /> {t('actions.delete')}</button></div></td>
                </tr>
              )) : <tr><td colSpan="4" className="px-5 py-8"><EmptyState title={t('common.noData')} /></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <ConfirmDialog open={Boolean(confirm)} title={confirm?.title} message={confirm?.message} variant={confirm?.variant} confirmText={confirm?.confirmText} onClose={() => setConfirm(null)} onConfirm={confirm?.onConfirm} />
    </div>
  );
}
