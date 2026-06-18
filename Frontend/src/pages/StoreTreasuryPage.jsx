import { useMemo, useState } from 'react';
import { Coins, Search, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate } from '../lib/utils';
import { makeId, useStoreMetrics, useStoreState } from '../lib/storeData';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

const emptyTransaction = { type: 'income', title: '', amount: '', note: '' };

export default function StoreTreasuryPage() {
  const { t, language, isRtl } = usePreferences();
  const toast = useToast();
  const [store, setStore] = useStoreState();
  const metrics = useStoreMetrics(store);
  const [form, setForm] = useState(emptyTransaction);
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sorted = [...store.treasury].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!term) return sorted;
    return sorted.filter((item) => [item.title, item.note, item.type].join(' ').toLowerCase().includes(term));
  }, [search, store.treasury]);

  function updateField(name, value) { setForm((current) => ({ ...current, [name]: value })); }

  function requestSave(event) {
    event.preventDefault();
    if (!form.title.trim() || !Number(form.amount)) { toast.warning(t('toast.requiredFields')); return; }
    setConfirm({ variant: 'info', title: t('store.confirmTreasuryTitle'), message: t('store.confirmTreasury'), confirmText: t('actions.save'), onConfirm: saveTransaction });
  }

  function saveTransaction() {
    setStore((current) => ({ ...current, treasury: [{ ...form, id: makeId('trx'), amount: Number(form.amount || 0), date: new Date().toISOString() }, ...current.treasury] }));
    toast.success(t('toast.created'));
    setForm(emptyTransaction);
    setConfirm(null);
  }

  function requestDelete(item) {
    setConfirm({ variant: 'danger', title: t('actions.confirmDeleteTitle'), message: `${t('actions.confirmDelete')} ${item.title}?`, confirmText: t('actions.delete'), onConfirm: () => {
      setStore((current) => ({ ...current, treasury: current.treasury.filter((row) => row.id !== item.id) }));
      toast.success(t('toast.deleted'));
      setConfirm(null);
    } });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-muted">{t('store.totalIncome')}</p><p className="mt-2 text-2xl font-bold text-emerald-600">{formatCurrency(metrics.income, language)}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">{t('store.totalExpenses')}</p><p className="mt-2 text-2xl font-bold text-rose-600">{formatCurrency(metrics.expenses, language)}</p></div>
        <div className="card p-5"><p className="text-sm text-muted">{t('dashboard.treasuryBalance')}</p><p className="mt-2 text-2xl font-bold text-primary">{formatCurrency(metrics.treasuryBalance, language)}</p></div>
      </section>

      <section className="card p-6">
        <div className={isRtl ? 'text-right' : ''}><h3 className="text-xl font-semibold text-primary">{t('pages.treasury.title')}</h3><p className="mt-1 text-sm text-muted">{t('pages.treasury.description')}</p></div>
        <form onSubmit={requestSave} className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div><label className="label">{t('common.type')}</label><select className="input" value={form.type} onChange={(e) => updateField('type', e.target.value)}><option value="income">{t('store.income')}</option><option value="expense">{t('store.expense')}</option></select></div>
          <div><label className="label">{t('common.name')}</label><input className="input" value={form.title} onChange={(e) => updateField('title', e.target.value)} /></div>
          <div><label className="label">{t('common.total')}</label><input className="input" type="number" min="0" value={form.amount} onChange={(e) => updateField('amount', e.target.value)} /></div>
          <div><label className="label">{t('common.description')}</label><input className="input" value={form.note} onChange={(e) => updateField('note', e.target.value)} /></div>
          <div className="flex items-end"><button type="submit" className="btn-primary w-full gap-2"><Coins className="h-4 w-4" />{t('actions.save')}</button></div>
        </form>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soft p-6"><h3 className="text-xl font-semibold text-primary">{t('store.treasuryTransactions')}</h3><div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" /><input className="input ps-11" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('actions.searchPlaceholder')} /></div></div>
        <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.type')}</th><th className="px-5 py-4 font-medium">{t('common.name')}</th><th className="px-5 py-4 font-medium">{t('common.total')}</th><th className="px-5 py-4 font-medium">{t('common.description')}</th><th className="px-5 py-4 font-medium">{t('common.lastUpdated')}</th><th className="px-5 py-4 font-medium">{t('common.actions')}</th></tr></thead><tbody>{rows.length ? rows.map((item) => <tr key={item.id} className="border-b border-soft transition hover:bg-cyan-50 dark:hover:bg-white/5"><td className="px-5 py-4"><span className={item.type === 'income' ? 'badge border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200' : 'badge border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200'}>{t(`store.${item.type}`)}</span></td><td className="px-5 py-4 font-medium text-primary">{item.title}</td><td className="px-5 py-4 text-muted">{formatCurrency(item.amount, language)}</td><td className="px-5 py-4 text-muted">{item.note || '—'}</td><td className="px-5 py-4 text-muted">{formatDate(item.date, language)}</td><td className="px-5 py-4"><button type="button" onClick={() => requestDelete(item)} className="btn-danger !px-3 !py-2 text-xs"><Trash2 className="h-3.5 w-3.5" /> {t('actions.delete')}</button></td></tr>) : <tr><td colSpan="6" className="px-5 py-8"><EmptyState title={t('common.noData')} /></td></tr>}</tbody></table></div>
      </section>
      <ConfirmDialog open={Boolean(confirm)} title={confirm?.title} message={confirm?.message} variant={confirm?.variant} confirmText={confirm?.confirmText} onClose={() => setConfirm(null)} onConfirm={confirm?.onConfirm} />
    </div>
  );
}
