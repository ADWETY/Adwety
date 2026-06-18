import { AlertTriangle, Building2, ChevronDown, LoaderCircle, ShieldCheck } from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { useRetailStore } from '../lib/retailStore';

export default function RetailPharmacySelector() {
  const { language } = usePreferences();
  const {
    isAdminRetail,
    pharmacies,
    selectedPharmacyId,
    selectedPharmacy,
    selectPharmacy,
    requiresPharmacySelection,
    isLoadingPharmacies,
    isSaving,
  } = useRetailStore();

  if (!isAdminRetail) return null;

  const ar = language === 'ar';
  return (
    <section className={`card mb-6 p-5 ${requiresPharmacySelection ? 'border-amber-300/70 dark:border-amber-400/40' : 'border-cyan-200/80 dark:border-cyan-400/30'}`}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,30rem)] lg:items-end">
        <div className="flex items-start gap-3">
          <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${requiresPharmacySelection ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200'}`}>
            {requiresPharmacySelection ? <AlertTriangle className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </span>
          <div>
            <h3 className="font-semibold text-primary">{ar ? 'صيدلية نقطة البيع' : 'POS pharmacy workspace'}</h3>
            <p className="mt-1 text-sm text-muted">
              {requiresPharmacySelection
                ? (ar ? 'اختر الصيدلية أولًا. لن يتم تحميل أو حفظ أي مخزن أو صنف أو عميل أو فاتورة قبل الاختيار.' : 'Select a pharmacy first. No warehouses, products, customers or invoices can be loaded or saved before selection.')
                : (ar ? `كل بيانات البيع والمخزون المعروضة الآن تخص: ${selectedPharmacy?.name || ''}` : `All displayed retail and inventory data now belongs to: ${selectedPharmacy?.name || ''}`)}
            </p>
          </div>
        </div>

        <div>
          <label className="label">{ar ? 'اختيار الصيدلية' : 'Select pharmacy'}</label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute start-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-soft" />
            <select
              className="input select-control ps-11"
              value={selectedPharmacyId}
              onChange={(event) => selectPharmacy(event.target.value)}
              disabled={isLoadingPharmacies || isSaving}
              aria-label={ar ? 'اختيار صيدلية نقطة البيع' : 'Select POS pharmacy'}
            >
              <option value="">{isLoadingPharmacies ? (ar ? 'جارٍ تحميل الصيدليات…' : 'Loading pharmacies…') : (ar ? 'اختر الصيدلية' : 'Choose a pharmacy')}</option>
              {pharmacies.map((pharmacy) => (
                <option key={pharmacy.id} value={pharmacy.id}>{pharmacy.name}{pharmacy.address ? ` — ${pharmacy.address}` : ''}</option>
              ))}
            </select>
            {isLoadingPharmacies
              ? <LoaderCircle className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-soft" />
              : <ChevronDown className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" />}
          </div>
          {!isLoadingPharmacies && !pharmacies.length ? (
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{ar ? 'لا توجد صيدليات نشطة أو معتمدة متاحة.' : 'No active or approved pharmacies are available.'}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
