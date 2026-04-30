import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Pencil, Plus } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import StatCard from '../components/StatCard';
import { getJson } from '../lib/api';
import { getDemoPharmacyDetails } from '../lib/demoData';
import { formatCurrency, stockStatus, stockTone, statusTone } from '../lib/utils';
import { usePreferences } from '../context/PreferencesContext';

export default function PharmacyDetailsPage() {
  const { id } = useParams();
  const { t, language } = usePreferences();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { async function load() { try { const result = await getJson(`/pharmacies/${id}`); setDetails(result.data || getDemoPharmacyDetails(id)); } catch (_error) { setDetails(getDemoPharmacyDetails(id)); } finally { setLoading(false); } } load(); }, [id]);
  if (loading) return <div className="card p-6 text-sm text-muted">{t('app.loading')}</div>;
  if (!details) return <EmptyState title={t('common.noData')} />;
  const { pharmacy, inventory, stats } = details;
  return <div className="space-y-6">
    <section className="card p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="text-3xl font-semibold text-primary">{pharmacy.name}</h3><p className="mt-2 text-sm text-muted">{pharmacy.address}</p><p className="mt-2 text-sm text-muted">{pharmacy.phone} · {pharmacy.email}</p></div><div className="flex flex-wrap gap-3"><span className={`badge ${statusTone(pharmacy.status)}`}>{pharmacy.status}</span><span className="badge border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{t('common.rating')}: {pharmacy.rating}</span></div></div><div className="mt-5 grid gap-4 md:grid-cols-2"><div className="sub-card p-4"><p className="text-sm text-muted">{t('common.workingHours')}</p><p className="mt-2 font-semibold text-primary">{pharmacy.working_hours || '—'}</p></div><div className="sub-card p-4"><p className="text-sm text-muted">{t('common.googleMapsUrl')}</p><a className="mt-2 inline-flex font-semibold text-cyan-700 underline dark:text-cyan-200" href={pharmacy.google_maps_url || `https://www.google.com/maps?q=${pharmacy.latitude},${pharmacy.longitude}`} target="_blank" rel="noreferrer">{t('actions.openMaps')}</a></div></div></section>
    <section className="grid gap-4 md:grid-cols-3"><StatCard label={t('common.totalItems')} value={stats.total_inventory_items || 0} icon={Plus} /><StatCard label={t('stock.low_stock')} value={stats.low_stock_count || 0} icon={Pencil} /><StatCard label={t('stock.out_of_stock')} value={stats.out_of_stock_count || 0} icon={MapPin} /></section>
    <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-200"><MapPin className="h-6 w-6" /><h3 className="mt-3 text-xl font-semibold">Map Preview</h3><p className="mt-2 text-sm">{t('common.latitude')}: {pharmacy.latitude}</p><p className="text-sm">{t('common.longitude')}: {pharmacy.longitude}</p></section>
    <section className="card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-soft p-6"><h3 className="text-xl font-semibold text-primary">{t('common.inventory')}</h3><Link className="btn-primary gap-2" to={`/medicines/new?pharmacy_id=${pharmacy.id}`}><Plus className="h-4 w-4" />{t('actions.addForPharmacy')}</Link></div><div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="table-head"><tr><th className="px-5 py-4 font-medium">{t('common.medicine')}</th><th className="px-5 py-4 font-medium">{t('common.category')}</th><th className="px-5 py-4 font-medium">{t('common.form')}</th><th className="px-5 py-4 font-medium">{t('common.price')}</th><th className="px-5 py-4 font-medium">{t('common.quantity')}</th><th className="px-5 py-4 font-medium">{t('common.stock')}</th></tr></thead><tbody>{inventory?.length ? inventory.map((item) => <tr key={item.inventory.id} className="border-b border-soft"><td className="px-5 py-4"><p className="font-medium text-primary">{item.drug.name}</p><p className="text-xs text-muted">{item.drug.strength}</p></td><td className="px-5 py-4 text-muted">{item.drug.category}</td><td className="px-5 py-4 text-muted">{item.drug.form}</td><td className="px-5 py-4 text-muted">{formatCurrency(item.inventory.price, language)}</td><td className="px-5 py-4 text-muted">{item.inventory.quantity}</td><td className="px-5 py-4"><span className={`badge ${stockTone(item.inventory.quantity)}`}>{t(`stock.${stockStatus(item.inventory.quantity)}`)}</span></td></tr>) : <tr><td colSpan="6" className="px-5 py-8 text-center text-muted">{t('common.noData')}</td></tr>}</tbody></table></div></section>
  </div>;
}
