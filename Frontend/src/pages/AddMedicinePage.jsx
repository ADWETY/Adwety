import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { getJson, postJson } from '../lib/api';
import { demoPharmacies } from '../lib/demoData';
import { formatCurrency, stockStatus, stockTone } from '../lib/utils';
import { usePreferences } from '../context/PreferencesContext';
import { useToast } from '../context/ToastContext';

const initialForm = { name: '', category: '', strength: '', form: '', price: '', quantity: '', pharmacy_id: '', description: '' };

export default function AddMedicinePage() {
  const { t, language } = usePreferences();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState(initialForm);
  const [pharmacies, setPharmacies] = useState(demoPharmacies);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { async function load() { try { const result = await getJson('/pharmacies'); const list = result.data || demoPharmacies; setPharmacies(list); const pharmacyId = params.get('pharmacy_id') || list[0]?.id || ''; setForm((current) => ({ ...current, pharmacy_id: pharmacyId })); } catch (_error) { const pharmacyId = params.get('pharmacy_id') || demoPharmacies[0]?.id || ''; setForm((current) => ({ ...current, pharmacy_id: pharmacyId })); } } load(); }, [params]);
  const selectedPharmacy = useMemo(() => pharmacies.find((item) => item.id === form.pharmacy_id), [pharmacies, form.pharmacy_id]);
  const status = stockStatus(form.quantity);
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: '' })); }
  function validate() { const next = {}; if (!form.name.trim()) next.name = t('forms.nameRequired'); if (!form.pharmacy_id) next.pharmacy_id = t('forms.pharmacyRequired'); if (Number(form.price) <= 0) next.price = t('forms.priceInvalid'); if (Number(form.quantity) < 0 || form.quantity === '') next.quantity = t('forms.quantityInvalid'); setErrors(next); return !Object.keys(next).length; }
  async function submit(event) { event.preventDefault(); if (!validate()) return; setSaving(true); try { await postJson('/medicines', { ...form, price: Number(form.price), quantity: Number(form.quantity) }); toast.success(t('toast.saved')); navigate('/medicines'); } catch (error) { toast.error(error.message || t('toast.failed')); } finally { setSaving(false); } }
  return <form className="grid gap-6 xl:grid-cols-[1fr_22rem]" onSubmit={submit}>
    <div className="space-y-6">
      <section className="card p-6"><h3 className="text-xl font-semibold text-primary">{t('common.basicInformation')}</h3><div className="mt-5 grid gap-5 md:grid-cols-2"><div><label className="label">{t('common.name')}</label><input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder={t('forms.medicineNamePlaceholder')} />{errors.name ? <p className="mt-1 text-sm text-rose-600">{errors.name}</p> : null}</div><div><label className="label">{t('common.category')}</label><input className="input" value={form.category} onChange={(e) => update('category', e.target.value)} placeholder={t('forms.categoryPlaceholder')} /></div><div><label className="label">{t('common.strength')}</label><input className="input" value={form.strength} onChange={(e) => update('strength', e.target.value)} placeholder={t('forms.strengthPlaceholder')} /></div><div><label className="label">{t('common.form')}</label><select className="input" value={form.form} onChange={(e) => update('form', e.target.value)}><option value="">{t('actions.select')}</option>{['Tablet','Capsule','Syrup','Injection','Inhaler','Drops','Cream'].map((x) => <option key={x}>{x}</option>)}</select></div></div></section>
      <section className="card p-6"><h3 className="text-xl font-semibold text-primary">{t('common.inventoryDetails')}</h3><div className="mt-5 grid gap-5 md:grid-cols-3"><div><label className="label">{t('common.price')}</label><input type="number" min="0" step="0.01" className="input" value={form.price} onChange={(e) => update('price', e.target.value)} />{errors.price ? <p className="mt-1 text-sm text-rose-600">{errors.price}</p> : null}</div><div><label className="label">{t('common.quantity')}</label><input type="number" min="0" className="input" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} />{errors.quantity ? <p className="mt-1 text-sm text-rose-600">{errors.quantity}</p> : null}</div><div><label className="label">{t('common.pharmacy')}</label><select className="input" value={form.pharmacy_id} onChange={(e) => update('pharmacy_id', e.target.value)}><option value="">{t('forms.pharmacyPlaceholder')}</option>{pharmacies.map((pharmacy) => <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}</option>)}</select>{errors.pharmacy_id ? <p className="mt-1 text-sm text-rose-600">{errors.pharmacy_id}</p> : null}</div></div></section>
      <section className="card p-6"><h3 className="text-xl font-semibold text-primary">{t('common.description')}</h3><textarea className="input mt-5 min-h-32" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder={t('forms.descriptionPlaceholder')} /></section>
    </div>
    <aside className="card h-fit p-6 xl:sticky xl:top-6"><h3 className="text-xl font-semibold text-primary">{t('common.livePreview')}</h3><div className="mt-5 sub-card p-5"><p className="text-2xl font-semibold text-primary">{form.name || t('common.medicine')}</p><p className="mt-2 text-sm text-muted">{form.category || t('common.category')} · {form.strength || t('common.strength')} · {form.form || t('common.form')}</p><p className="mt-4 text-lg font-semibold text-primary">{formatCurrency(form.price, language)}</p><p className="mt-2 text-sm text-muted">{selectedPharmacy?.name || t('common.pharmacy')}</p><span className={`mt-4 badge ${stockTone(status)}`}>{t(`stock.${status}`)}</span></div><div className="mt-6 flex flex-col gap-3"><button type="submit" className="btn-primary gap-2" disabled={saving}><Save className="h-4 w-4" />{saving ? t('app.loading') : t('actions.save')}</button><button type="button" className="btn-secondary gap-2" onClick={() => navigate('/medicines')}><X className="h-4 w-4" />{t('actions.cancel')}</button></div></aside>
  </form>;
}
