import { useMemo, useState } from 'react';
import { Edit3, Eye, Search, Trash2, UserPlus } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../lib/utils';
import { makeId, useStoreState } from '../lib/storeData';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

const emptyPerson = { name: '', phone: '', email: '', address: '', balance: 0, notes: '' };

export default function StorePeoplePage({ type = 'customers' }) {
  const { t, language, isRtl } = usePreferences();
  const toast = useToast();
  const [store, setStore] = useStoreState();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyPerson);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const isSupplier = type === 'suppliers';
  const collection = store[type] || [];
  const routeKey = isSupplier ? 'suppliers' : 'customers';

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return collection;
    return collection.filter((item) => [item.name, item.phone, item.email, item.address].join(' ').toLowerCase().includes(term));
  }, [search, collection]);

  function updateField(name, value) { setForm((current) => ({ ...current, [name]: value })); }
  function clearForm() { setForm(emptyPerson); setEditingId(null); }
  function startEdit(person) { setForm(person); setEditingId(person.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  function requestSave(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { toast.warning(t('toast.requiredFields')); return; }
    setConfirm({
      variant: 'info',
      title: editingId ? t('actions.confirmUpdate') : t('actions.confirmCreate'),
      message: editingId ? t(`store.confirmUpdate${isSupplier ? 'Supplier' : 'Customer'}`) : t(`store.confirmCreate${isSupplier ? 'Supplier' : 'Customer'}`),
      confirmText: editingId ? t('actions.update') : t('actions.create'),
      onConfirm: savePerson,
    });
  }

  function savePerson() {
    setStore((current) => {
      const payload = { ...form, id: editingId || makeId(isSupplier ? 'sup' : 'cus'), balance: Number(form.balance || 0) };
      return { ...current, [type]: editingId ? current[type].map((item) => (item.id === editingId ? payload : item)) : [payload, ...current[type]] };
    });
    toast.success(editingId ? t('toast.updated') : t('toast.created'));
    clearForm();
    setConfirm(null);
  }

  function requestDelete(person) {
    setConfirm({
      variant: 'danger',
      title: t('actions.confirmDeleteTitle'),
      message: `${t('actions.confirmDelete')} ${person.name}?`,
      confirmText: t('actions.delete'),
      onConfirm: () => deletePerson(person.id),
    });
  }

  function deletePerson(id) {
    setStore((current) => ({ ...current, [type]: current[type].filter((item) => item.id !== id) }));
    toast.success(t('toast.deleted'));
    setConfirm(null);
    setSelected(null);
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className={isRtl ? 'text-right' : ''}>
          <h3 className="text-xl font-semibold text-primary">{t(`pages.${routeKey}.title`)}</h3>
          <p className="mt-1 text-sm text-muted">{t(`pages.${routeKey}.description`)}</p>
        </div>
        <form onSubmit={requestSave} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div><label className="label">{t('common.name')}</label><input className="input" value={form.name} onChange={(e) => updateField('name', e.target.value)} /></div>
          <div><label className="label">{t('common.phone')}</label><input className="input" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} /></div>
          <div><label className="label">{t('common.email')}</label><input className="input" value={form.email} onChange={(e) => updateField('email', e.target.value)} /></div>
          <div><label className="label">{t('common.address')}</label><input className="input" value={form.address} onChange={(e) => updateField('address', e.target.value)} /></div>
          <div><label className="label">{t('store.openingBalance')}</label><input className="input" type="number" value={form.balance} onChange={(e) => updateField('balance', e.target.value)} /></div>
          <div><label className="label">{t('common.description')}</label><input className="input" value={form.notes} onChange={(e) => updateField('notes', e.target.value)} /></div>
          <div className="md:col-span-2 xl:col-span-3 flex flex-wrap gap-3"><button type="submit" className="btn-primary gap-2"><UserPlus className="h-4 w-4" />{editingId ? t('actions.update') : t('actions.create')}</button>{editingId ? <button type="button" className="btn-secondary" onClick={clearForm}>{t('actions.cancel')}</button> : null}</div>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soft p-6">
          <h3 className="text-xl font-semibold text-primary">{t(`store.${routeKey}List`)}</h3>
          <div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" /><input className="input ps-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('actions.searchPlaceholder')} /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.name')}</th><th className="px-5 py-4 font-medium">{t('common.phone')}</th><th className="px-5 py-4 font-medium">{t('common.email')}</th><th className="px-5 py-4 font-medium">{t('store.balance')}</th><th className="px-5 py-4 font-medium">{t('common.actions')}</th></tr></thead>
            <tbody>
              {rows.length ? rows.map((person) => (
                <tr key={person.id} className="border-b border-soft transition hover:bg-cyan-50 dark:hover:bg-white/5">
                  <td className="px-5 py-4 font-medium text-primary">{person.name}</td>
                  <td className="px-5 py-4 text-muted">{person.phone}</td>
                  <td className="px-5 py-4 text-muted">{person.email || '—'}</td>
                  <td className="px-5 py-4 text-muted">{formatCurrency(person.balance, language)}</td>
                  <td className="px-5 py-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setSelected(person)} className="btn-secondary !px-3 !py-2 text-xs"><Eye className="h-3.5 w-3.5" /> {t('actions.viewDetails')}</button><button type="button" onClick={() => startEdit(person)} className="btn-secondary !px-3 !py-2 text-xs"><Edit3 className="h-3.5 w-3.5" /> {t('actions.edit')}</button><button type="button" onClick={() => requestDelete(person)} className="btn-danger !px-3 !py-2 text-xs"><Trash2 className="h-3.5 w-3.5" /> {t('actions.delete')}</button></div></td>
                </tr>
              )) : <tr><td colSpan="5" className="px-5 py-8"><EmptyState title={t('common.noData')} /></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="card w-full max-w-xl p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-semibold text-primary">{selected.name}</h3><p className="mt-1 text-sm text-muted">{isSupplier ? t('nav.suppliers') : t('nav.customers')}</p></div><button type="button" onClick={() => setSelected(null)} className="btn-secondary !py-2">{t('actions.close')}</button></div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="sub-card p-4"><p className="text-xs text-muted">{t('common.phone')}</p><p className="mt-1 font-semibold text-primary">{selected.phone}</p></div>
              <div className="sub-card p-4"><p className="text-xs text-muted">{t('common.email')}</p><p className="mt-1 font-semibold text-primary">{selected.email || '—'}</p></div>
              <div className="sub-card p-4 md:col-span-2"><p className="text-xs text-muted">{t('common.address')}</p><p className="mt-1 font-semibold text-primary">{selected.address || '—'}</p></div>
              <div className="sub-card p-4"><p className="text-xs text-muted">{t('store.balance')}</p><p className="mt-1 font-semibold text-primary">{formatCurrency(selected.balance, language)}</p></div>
              <div className="sub-card p-4"><p className="text-xs text-muted">{t('common.description')}</p><p className="mt-1 font-semibold text-primary">{selected.notes || '—'}</p></div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog open={Boolean(confirm)} title={confirm?.title} message={confirm?.message} variant={confirm?.variant} confirmText={confirm?.confirmText} onClose={() => setConfirm(null)} onConfirm={confirm?.onConfirm} />
    </div>
  );
}
