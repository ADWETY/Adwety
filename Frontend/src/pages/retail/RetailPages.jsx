import { Children, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  Ban,
  BarChart3,
  Boxes,
  Barcode,
  ClipboardCheck,
  ChevronDown,
  Download,
  Eye,
  FileText,
  PackagePlus,
  Pencil,
  Plus,
  Printer,
  Receipt,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  ShoppingCart,
  Tags,
  Trash2,
  Truck,
  UsersRound,
  WalletCards,
  Upload,
  Warehouse,
  X,
} from 'lucide-react';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { usePreferences } from '../../context/PreferencesContext';
import { useToast } from '../../context/ToastContext';
import { exportToCsv, formatCurrency, formatDate, printElementById, statusTone, stockTone } from '../../lib/utils';
import { extractObject, getJson } from '../../lib/api';
import {
  addStock,
  getCategoryName,
  getCustomerName,
  getProductName,
  getProductStock,
  getSupplierName,
  getWarehouseName,
  invoiceDue,
  invoiceLineTotal,
  invoiceSubtotal,
  invoiceTotal,
  lowStockProducts,
  lookupRetailProduct,
  makeId,
  nextDocNumber,
  normalizeProductUnits,
  primaryProductUnit,
  profitForInvoice,
  removeStock,
  searchRetailProducts,
  todayIso,
  treasuryBalance,
  useRetailStore,
} from '../../lib/retailStore';

const copy = {
  en: {
    add: 'Add', update: 'Update', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', save: 'Save', reset: 'Refresh backend data', search: 'Search', print: 'Print', export: 'Export CSV', actions: 'Actions', all: 'All', active: 'Active', inactive: 'Inactive', name: 'Name', status: 'Status', phone: 'Phone', email: 'Email', address: 'Address', date: 'Date', notes: 'Notes', total: 'Total', discount: 'Discount', paid: 'Paid', due: 'Due', subtotal: 'Subtotal', qty: 'Qty', price: 'Price', product: 'Product', products: 'Products', category: 'Category', warehouse: 'Warehouse', customer: 'Customer', supplier: 'Supplier', balance: 'Balance', openingBalance: 'Opening balance', balanceType: 'Balance type', debit: 'Debit', credit: 'Credit', code: 'Code', barcode: 'Barcode', unit: 'Unit', unitFactor: 'Unit factor', purchasePrice: 'Purchase price', salePrice: 'Sale price', minStock: 'Minimum stock', stock: 'Stock', available: 'Available', amount: 'Amount', type: 'Type', income: 'Income', expense: 'Expense', description: 'Description', saved: 'Saved successfully', exported: 'Exported successfully', noData: 'No matching data', insufficient: 'Insufficient stock for selected warehouse.', details: 'Details', void: 'Cancel invoice', paymentStatus: 'Payment status', fromDate: 'From date', toDate: 'To date', party: 'Party', fullyPaid: 'Paid', partial: 'Partial', unpaid: 'Unpaid', canceled: 'Canceled', draft: 'Draft', reportType: 'Report type', scan: 'Scan / Add barcode', close: 'Close', invoiceNo: 'Invoice no.', paymentMethod: 'Payment method', cashier: 'Cashier', thermalPrint: 'Print invoice', advancedFilters: 'Advanced filters', stockMovement: 'Stock movement', profit: 'Profit', valuation: 'Valuation', report: 'Report', reason: 'Reason', refund: 'Refund', source: 'Source', from: 'From', to: 'To', reference: 'Reference', dateRange: 'Date range', resetFilters: 'Reset filters', savedAndStockUpdated: 'Saved and stock updated', invoiceCanceled: 'Invoice canceled and stock reversed', invoiceDeleted: 'Invoice deleted', barcodeNotFound: 'Barcode/code not found in products.', invoiceDraftCanceled: 'Invoice draft canceled.', invoiceSummary: 'Invoice summary', printPreview: 'Print preview', lowStock: 'Low stock', salesTotal: 'Sales total', purchasesTotal: 'Purchases total', treasuryBalance: 'Treasury balance', estimatedProfit: 'Estimated profit', recentSalesInvoices: 'Recent sales invoices', openInvoices: 'Open invoices', quickActions: 'Quick actions', openPos: 'Open POS', newPurchaseInvoice: 'New purchase invoice', warehouseTransfer: 'Warehouse transfer', advancedReports: 'Advanced reports', totalQuantity: 'Total quantity', purchaseValue: 'Purchase value', value: 'Value', saleUnits: 'Sale units', addUnit: 'Add unit', units: 'Units', importProducts: 'Import products', sample: 'Sample', printPriceLabels: 'Print price labels', priceLabelsPreview: 'Price labels preview', printablePriceCards: 'Printable shelf/price cards', unitLabel: 'Unit', currentQty: 'Current qty', countedQty: 'Counted qty', difference: 'Difference', valueImpact: 'Value impact', previousStocktakes: 'Previous stocktakes', items: 'Items', netDiff: 'Net diff', salesReport: 'Sales report', purchasesReport: 'Purchases report', profitReport: 'Profit report', stockValuation: 'Stock valuation', customerBalances: 'Customer balances', supplierBalances: 'Supplier balances', treasuryReport: 'Treasury report', salesDue: 'Sales due', purchaseDue: 'Purchase due', transferOut: 'Transfer out', transferIn: 'Transfer in', salesReturn: 'Sales return', purchaseReturn: 'Purchase return', reportsHub: 'Reports hub', inventoryReport: 'Inventory report', mainReports: 'Main reports', salesReportsHint: 'Sales invoices, paid, due and customers', stockReportsHint: 'Inventory quantities and stock value', profitReportsHint: 'Profit by invoice and net sales', purchasesReportsHint: 'Purchase invoices, paid and due',
  },
  ar: {
    add: 'إضافة', update: 'تحديث', cancel: 'إلغاء', delete: 'حذف', edit: 'تعديل', save: 'حفظ', reset: 'تحديث البيانات من الخادم', search: 'بحث', print: 'طباعة', export: 'تصدير CSV', actions: 'إجراءات', all: 'الكل', active: 'نشط', inactive: 'غير نشط', name: 'الاسم', status: 'الحالة', phone: 'الهاتف', email: 'البريد', address: 'العنوان', date: 'التاريخ', notes: 'ملاحظات', total: 'الإجمالي', discount: 'الخصم', paid: 'المدفوع', due: 'المتبقي', subtotal: 'الإجمالي قبل الخصم', qty: 'الكمية', price: 'السعر', product: 'الصنف', products: 'الأصناف', category: 'التصنيف', warehouse: 'المخزن', customer: 'العميل', supplier: 'المورد', balance: 'الرصيد', openingBalance: 'رصيد افتتاحي', balanceType: 'طبيعة الرصيد', debit: 'مدين', credit: 'دائن', code: 'الكود', barcode: 'الباركود', unit: 'الوحدة', unitFactor: 'معامل الوحدة', purchasePrice: 'سعر الشراء', salePrice: 'سعر البيع', minStock: 'حد الطلب', stock: 'المخزون', available: 'المتاح', amount: 'المبلغ', type: 'النوع', income: 'إيراد', expense: 'مصروف', description: 'الوصف', saved: 'تم الحفظ بنجاح', exported: 'تم التصدير بنجاح', noData: 'لا توجد بيانات مطابقة', insufficient: 'المخزون غير كافٍ في المخزن المحدد.', details: 'التفاصيل', void: 'إلغاء الفاتورة', paymentStatus: 'حالة السداد', fromDate: 'من تاريخ', toDate: 'إلى تاريخ', party: 'الطرف', fullyPaid: 'مسددة', partial: 'جزئية', unpaid: 'غير مسددة', canceled: 'ملغاة', draft: 'مسودة', reportType: 'نوع التقرير', scan: 'مسح/إضافة باركود', close: 'إغلاق', invoiceNo: 'رقم الفاتورة', paymentMethod: 'طريقة الدفع', cashier: 'الكاشير', thermalPrint: 'طباعة فاتورة', advancedFilters: 'فلاتر متقدمة', stockMovement: 'حركة المخزون', profit: 'الربح', valuation: 'قيمة المخزون', report: 'تقرير', reason: 'السبب', refund: 'المسترد', source: 'المصدر', from: 'من', to: 'إلى', reference: 'مرجع', dateRange: 'الفترة', resetFilters: 'مسح الفلاتر', savedAndStockUpdated: 'تم الحفظ وتحديث المخزون', invoiceCanceled: 'تم إلغاء الفاتورة وعكس حركة المخزون', invoiceDeleted: 'تم حذف الفاتورة', barcodeNotFound: 'الباركود/الكود غير موجود في الأصناف.', invoiceDraftCanceled: 'تم إلغاء الفاتورة الحالية.', invoiceSummary: 'ملخص الفاتورة', printPreview: 'معاينة الطباعة', lowStock: 'مخزون منخفض', salesTotal: 'إجمالي المبيعات', purchasesTotal: 'إجمالي المشتريات', treasuryBalance: 'رصيد الخزينة', estimatedProfit: 'الربح التقديري', recentSalesInvoices: 'آخر فواتير البيع', openInvoices: 'فتح الفواتير', quickActions: 'إجراءات سريعة', openPos: 'فتح نقطة البيع', newPurchaseInvoice: 'فاتورة مشتريات جديدة', warehouseTransfer: 'تحويل مخزني', advancedReports: 'تقارير متقدمة', totalQuantity: 'إجمالي الكمية', purchaseValue: 'قيمة الشراء', value: 'القيمة', saleUnits: 'وحدات البيع', addUnit: 'إضافة وحدة', units: 'الوحدات', importProducts: 'استيراد الأصناف', sample: 'مثال', printPriceLabels: 'طباعة الأسعار', priceLabelsPreview: 'معاينة طباعة الأسعار', printablePriceCards: 'كروت أسعار قابلة للطباعة', unitLabel: 'الوحدة', currentQty: 'الكمية الحالية', countedQty: 'الكمية المعدودة', difference: 'الفرق', valueImpact: 'تأثير القيمة', previousStocktakes: 'عمليات جرد سابقة', items: 'الأصناف', netDiff: 'صافي الفرق', salesReport: 'تقرير المبيعات', purchasesReport: 'تقرير المشتريات', profitReport: 'تقرير الأرباح', stockValuation: 'تقييم المخزون', customerBalances: 'أرصدة العملاء', supplierBalances: 'أرصدة الموردين', treasuryReport: 'تقرير الخزينة', salesDue: 'متبقي المبيعات', purchaseDue: 'متبقي المشتريات', transferOut: 'تحويل صادر', transferIn: 'تحويل وارد', salesReturn: 'مرتجع بيع', purchaseReturn: 'مرتجع شراء', reportsHub: 'مركز التقارير', inventoryReport: 'تقرير المخزون', mainReports: 'التقارير الرئيسية', salesReportsHint: 'فواتير البيع والمدفوع والمتبقي والعملاء', stockReportsHint: 'كميات المخزون وقيمة الأصناف', profitReportsHint: 'الأرباح حسب الفاتورة وصافي المبيعات', purchasesReportsHint: 'فواتير المشتريات والمدفوع والمتبقي',
  },
};

function useRetailCopy() {
  const { language } = usePreferences();
  return { L: (key) => copy[language]?.[key] || copy.en[key] || key, language, B: (en, ar) => (language === 'ar' ? ar : en) };
}


function localizeWarehouseNameForCard(name, language) {
  const text = String(name || '').trim();
  if (!text || text === '—' || language !== 'ar') return text || '—';
  if (/[\u0600-\u06FF]/.test(text)) return text;

  const normalized = text.replace(/\s+/g, ' ');
  const knownNames = {
    'Main Pharmacist Pharmacy - Main Warehouse': 'صيدلية الصيدلي الرئيسية - المخزن الرئيسي',
    'Main Pharmacy - Main Warehouse': 'الصيدلية الرئيسية - المخزن الرئيسي',
    'Main Warehouse': 'المخزن الرئيسي',
    'Branch Warehouse': 'مخزن الفرع',
    'Branch Stock': 'مخزن الفرع',
  };

  if (knownNames[normalized]) return knownNames[normalized];

  return normalized
    .replace(/Main Pharmacist Pharmacy/gi, 'صيدلية الصيدلي الرئيسية')
    .replace(/Main Pharmacy/gi, 'الصيدلية الرئيسية')
    .replace(/Main Warehouse/gi, 'المخزن الرئيسي')
    .replace(/Branch Warehouse/gi, 'مخزن الفرع')
    .replace(/Branch Stock/gi, 'مخزن الفرع')
    .replace(/Warehouse/gi, 'مخزن')
    .replace(/Pharmacy/gi, 'صيدلية')
    .replace(/Pharmacist/gi, 'الصيدلي')
    .replace(/\s*-\s*/g, ' - ');
}

function normalizeSmartQuery(value) {
  return String(value || '').trim().toLowerCase();
}

function smartTokenMatch(text, query) {
  const normalized = normalizeSmartQuery(query);
  if (!normalized) return true;
  return normalized.split(/\s+/).filter(Boolean).every((token) => text.includes(token));
}

function smartProductFilter(product, data, query) {
  const q = normalizeSmartQuery(query);
  if (!q) return true;
  const stock = getProductStock(product);
  const minStock = Number(product.minStock || 0);
  const salePrice = Number(product.salePrice || 0);
  const purchasePrice = Number(product.purchasePrice || 0);
  const text = `${product.code || ''} ${product.barcode || ''} ${product.name || ''} ${getCategoryName(data, product.categoryId) || ''} ${normalizeProductUnits(product).map((unit) => unit.name).join(' ')} ${stock} ${salePrice}`.toLowerCase();
  if (/(low|reorder|minimum|منخفض|قليل|حد|ناقص)/.test(q)) return stock > 0 && stock <= minStock;
  if (/(out|zero|empty|صفر|نفد|غير متوفر|منتهي)/.test(q)) return stock <= 0;
  if (/(no barcode|without barcode|بدون باركود|لا يوجد باركود)/.test(q)) return !String(product.barcode || '').trim();
  if (/(profitable|profit|ربح|مربح)/.test(q)) return salePrice > purchasePrice;
  if (/(loss|خسارة)/.test(q)) return salePrice < purchasePrice;
  if (/(active|نشط)/.test(q)) return (product.status || 'active') === 'active';
  if (/(inactive|غير نشط)/.test(q)) return product.status === 'inactive';
  return smartTokenMatch(text, q);
}


const retailTabs = [
  { to: '/retail-dashboard', en: 'Dashboard', ar: 'لوحة التحكم' },
  { to: '/pos', en: 'POS', ar: 'نقطة البيع' },
  { to: '/products', en: 'Products', ar: 'الأصناف' },
  { to: '/categories', en: 'Categories', ar: 'التصنيفات' },
  { to: '/inventory-count', en: 'Stocktake', ar: 'جرد المخزون' },
  { to: '/sales-invoices', en: 'Invoices', ar: 'الفواتير' },
  { to: '/purchases', en: 'Purchases', ar: 'المشتريات' },
  { to: '/returns', en: 'Returns', ar: 'المرتجعات' },
  { to: '/treasury', en: 'Treasury', ar: 'الخزينة' },
  { to: '/business-reports', en: 'Reports', ar: 'التقارير' },
];

function RetailTabs() {
  const { language } = useRetailCopy();
  const location = typeof window !== 'undefined' ? window.location.pathname : '';
  return <div className="no-print -mx-1 mb-4 flex flex-wrap gap-2 pb-2">
    {retailTabs.map((tab) => <Link key={tab.to} to={tab.to} className={`whitespace-nowrap rounded-2xl border px-4 py-2 text-sm font-medium transition ${location === tab.to ? 'border-cyan-500 bg-cyan-600 text-white shadow-sm' : 'border-soft bg-white/80 text-muted hover:border-cyan-300 hover:text-cyan-700 dark:bg-white/5 dark:hover:text-white'}`}>{language === 'ar' ? tab.ar : tab.en}</Link>)}
  </div>;
}

function PageTitle({ action }) {
  if (!action) return null;

  return <div className="no-print flex justify-end">{action}</div>;
}

function TextInput({ label, value, onChange, type = 'text', placeholder = '', min, step, onKeyDown, autoFocus = false, inputRef, inputMode }) {
  return <div><label className="label">{label}</label><input ref={inputRef} className="input" type={type} inputMode={inputMode} value={value ?? ''} min={min} step={step} placeholder={placeholder} onKeyDown={onKeyDown} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} /></div>;
}

function SelectInput({ label, value, onChange, children, disabled = false, placeholder = '', emptyText = '', className = '' }) {
  const optionCount = Children.count(children);
  const safeValue = optionCount ? (value ?? '') : '';
  return <div className={className}>
    {label ? <label className="label">{label}</label> : null}
    <div className="relative">
      <select
        className="input select-control"
        value={safeValue}
        disabled={disabled}
        aria-disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {!optionCount ? <option value="" disabled>{emptyText || placeholder || 'No options available'}</option> : children}
      </select>
      <ChevronDown className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-soft" />
    </div>
  </div>;
}

function Toolbar({ query, onQuery, onPrint, onExport, children }) {
  const { L } = useRetailCopy();
  return <section className="card p-5"><div className="flex flex-col gap-3 xl:flex-row xl:items-center"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute start-4 top-3.5 h-4 w-4 text-soft" /><input className="input !ps-11" value={query} onChange={(e) => onQuery(e.target.value)} placeholder={L('search')} /></div>{children}<button className="btn-secondary gap-2" type="button" onClick={onExport}><Download className="h-4 w-4" />{L('export')}</button><button className="btn-secondary gap-2" type="button" onClick={onPrint}><Printer className="h-4 w-4" />{L('print')}</button></div></section>;
}

function SimpleTable({ id, columns, rows, renderRow, empty }) {
  return <section id={id} className="card overflow-hidden"><div className="table-responsive"><table className="responsive-table w-full text-sm"><thead className="table-head"><tr>{columns.map((column) => <th key={column} className="px-4 py-3 font-medium">{column}</th>)}</tr></thead><tbody>{rows.map(renderRow)}</tbody></table></div>{!rows.length ? <div className="p-6"><EmptyState title={empty} description="" /></div> : null}</section>;
}

function StatusBadge({ status }) {
  const { L } = useRetailCopy();
  if (status === 'canceled') return <span className={`badge ${statusTone('inactive')}`}>{L('canceled')}</span>;
  return <span className={`badge ${statusTone(status)}`}>{status === 'inactive' ? L('inactive') : L('active')}</span>;
}

function PaymentBadge({ invoice }) {
  const { L } = useRetailCopy();
  const due = invoiceDue(invoice);
  const paid = Number(invoice.paid || 0);
  let label = L('unpaid');
  let tone = 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200';
  if (due <= 0) { label = L('fullyPaid'); tone = 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200'; }
  else if (paid > 0) { label = L('partial'); tone = 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200'; }
  return <span className={`badge ${tone}`}>{label}</span>;
}

function resetButton(reset, label) {
  return <button className="btn-secondary gap-2" type="button" onClick={reset}><RefreshCcw className="h-4 w-4" />{label}</button>;
}

function getInvoiceStatus(invoice) {
  return invoice?.status || 'active';
}

function getInvoicePartyName(data, invoice, kind) {
  return kind === 'sale' ? getCustomerName(data, invoice.customerId) : getSupplierName(data, invoice.supplierId);
}

function invoiceSearchText(data, invoice, kind) {
  return `${kind} ${invoice.number} ${invoice.date} ${getInvoicePartyName(data, invoice, kind)} ${getWarehouseName(data, invoice.warehouseId)} ${(invoice.items || []).map((item) => getProductName(data, item.productId)).join(' ')}`.toLowerCase();
}

function restoreStockForInvoice(draft, invoice, kind) {
  if (!invoice || getInvoiceStatus(invoice) === 'canceled') return;
  (invoice.items || []).forEach((item) => {
    if (kind === 'sale') addStock(draft, item.productId, invoice.warehouseId, item.qty);
    else removeStock(draft, item.productId, invoice.warehouseId, item.qty);
  });
}

function applyStockForInvoice(draft, invoice, kind) {
  if (!invoice || getInvoiceStatus(invoice) === 'canceled') return;
  (invoice.items || []).forEach((item) => {
    if (kind === 'sale') removeStock(draft, item.productId, invoice.warehouseId, item.qty);
    else addStock(draft, item.productId, invoice.warehouseId, item.qty);
  });
}

function canApplySale(data, warehouseId, items) {
  return (items || []).every((item) => {
    const product = data.products.find((row) => row.id === item.productId);
    return getProductStock(product, warehouseId) >= Number(item.qty || 0);
  });
}

function normalizeMoney(value) {
  return Number(value || 0);
}

function Modal({ title, children, onClose, wide = false }) {
  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"><div className={`card my-6 w-full ${wide ? 'max-w-6xl' : 'max-w-3xl'} p-6 shadow-2xl`}><div className="mb-5 flex items-center justify-between gap-4"><h3 className="text-xl font-semibold text-primary">{title}</h3><button className="btn-secondary !px-3 !py-2" type="button" onClick={onClose}><X className="h-4 w-4" /></button></div>{children}</div></div>;
}

function InvoicePrintable({ id, data, invoice, kind, compact = false }) {
  const { L, language } = useRetailCopy();
  if (!invoice) return null;
  const partyLabel = kind === 'sale' ? L('customer') : L('supplier');
  const partyName = getInvoicePartyName(data, invoice, kind);
  const title = kind === 'sale' ? (language === 'ar' ? 'فاتورة بيع' : 'Sales Invoice') : (language === 'ar' ? 'فاتورة شراء' : 'Purchase Invoice');
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const invoiceStatus = getInvoiceStatus(invoice);
  const reference = `${invoice.number || invoice.id}-${kind}`;
  return <article id={id} dir={dir} className={`invoice-print ${compact ? 'invoice-print-compact' : 'invoice-print-a4'}`}>
    <header className="invoice-header">
      <div className="invoice-brand-block">
        <p className="invoice-brand">BAHAMAS / MATGR</p>
        <h1>{title}</h1>
        <p className="invoice-subtitle">{language === 'ar' ? 'نظام إدارة البيع والمخازن' : 'Retail Management System'}</p>
      </div>
      <div className="invoice-reference-box">
        <span>{language === 'ar' ? 'مرجع' : 'REF'}</span>
        <strong>{invoice.number}</strong>
        <small>{reference}</small>
      </div>
    </header>

    <section className="invoice-meta-grid">
      <div><span>{L('invoiceNo')}</span><strong>{invoice.number}</strong></div>
      <div><span>{L('date')}</span><strong>{formatDate(invoice.date, language)}</strong></div>
      <div><span>{partyLabel}</span><strong>{partyName}</strong></div>
      <div><span>{L('warehouse')}</span><strong>{getWarehouseName(data, invoice.warehouseId)}</strong></div>
      <div><span>{L('paymentMethod')}</span><strong>{invoice.paymentMethod || 'cash'}</strong></div>
      <div><span>{L('status')}</span><strong>{invoiceStatus}</strong></div>
    </section>

    <table className="invoice-items-table">
      <thead>
        <tr>
          <th>#</th>
          <th>{L('product')}</th>
          <th>{L('qty')}</th>
          <th>{L('price')}</th>
          <th>{L('discount')}</th>
          <th>{L('total')}</th>
        </tr>
      </thead>
      <tbody>{(invoice.items || []).map((item, index) => <tr key={`${item.productId}-${index}`}>
        <td>{index + 1}</td>
        <td>{getProductName(data, item.productId)}</td>
        <td>{item.qty}</td>
        <td>{formatCurrency(item.price, language)}</td>
        <td>{formatCurrency(item.discount || 0, language)}</td>
        <td>{formatCurrency(invoiceLineTotal(item), language)}</td>
      </tr>)}</tbody>
    </table>

    <section className="invoice-summary-section">
      <div className="invoice-notes-box">
        <span>{L('notes')}</span>
        <p>{invoice.notes || (language === 'ar' ? 'لا توجد ملاحظات' : 'No notes')}</p>
      </div>
      <div className="invoice-totals-box">
        <div><span>{L('subtotal')}</span><strong>{formatCurrency(invoiceSubtotal(invoice.items), language)}</strong></div>
        <div><span>{L('discount')}</span><strong>{formatCurrency(invoice.discount, language)}</strong></div>
        <div className="invoice-grand-total"><span>{L('total')}</span><strong>{formatCurrency(invoiceTotal(invoice), language)}</strong></div>
        <div><span>{L('paid')}</span><strong>{formatCurrency(invoice.paid, language)}</strong></div>
        <div><span>{L('due')}</span><strong>{formatCurrency(invoiceDue(invoice), language)}</strong></div>
      </div>
    </section>

    <footer className="invoice-footer">
      <div>
        <strong>{language === 'ar' ? 'توقيع المستلم' : 'Receiver signature'}</strong>
        <span></span>
      </div>
      <div>
        <strong>{language === 'ar' ? 'توقيع الكاشير' : 'Cashier signature'}</strong>
        <span></span>
      </div>
      <p>{language === 'ar' ? 'شكرًا لتعاملكم معنا' : 'Thank you for your business'}</p>
    </footer>
  </article>;
}

function DashboardSalesChart({ invoices, language }) {
  const rows = Object.values((invoices || []).reduce((acc, invoice) => {
    if (getInvoiceStatus(invoice) === 'canceled') return acc;
    const key = invoice.date || todayIso();
    acc[key] = acc[key] || { date: key, total: 0, count: 0 };
    acc[key].total += invoiceTotal(invoice);
    acc[key].count += 1;
    return acc;
  }, {})).sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  const max = Math.max(1, ...rows.map((row) => row.total));
  return <section className="card p-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold text-primary">{language === 'ar' ? 'مخطط المبيعات' : 'Sales chart'}</h3><p className="text-sm text-muted">{language === 'ar' ? 'إجمالي المبيعات اليومية مثل مخطط لوحة MATGR.' : 'Daily sales totals similar to MATGR dashboard chart.'}</p></div><span className="badge border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200">{language === 'ar' ? 'آخر 7 أيام نشطة' : 'Last 7 active days'}</span></div>
    <div className="flex h-64 items-end gap-3 rounded-3xl border border-soft bg-gradient-to-b from-cyan-50/60 to-white p-4 dark:from-cyan-500/10 dark:to-white/5">
      {rows.length ? rows.map((row) => <div key={row.date} className="flex min-w-16 flex-1 flex-col items-center gap-2">
        <div className="text-xs font-semibold text-primary">{formatCurrency(row.total, language)}</div>
        <div className="w-full rounded-t-2xl bg-cyan-600 shadow-sm dark:bg-cyan-300" style={{ height: `${Math.max(8, (row.total / max) * 180)}px` }} />
        <div className="text-center text-xs text-muted">{row.date.slice(5)}</div>
      </div>) : <div className="flex h-full w-full items-center justify-center text-sm text-muted">{language === 'ar' ? 'لا توجد بيانات مبيعات بعد' : 'No sales data yet'}</div>}
    </div>
  </section>;
}

export function RetailDashboardPage() {
  const { data, reset } = useRetailStore();
  const { L, language, B } = useRetailCopy();
  const navigate = useNavigate();
  const totalSales = data.salesInvoices.filter((i) => getInvoiceStatus(i) !== 'canceled').reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const totalPurchases = data.purchaseInvoices.filter((i) => getInvoiceStatus(i) !== 'canceled').reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const totalProfit = data.salesInvoices.filter((i) => getInvoiceStatus(i) !== 'canceled').reduce((sum, invoice) => sum + profitForInvoice(data, invoice), 0);
  const lowRows = lowStockProducts(data);
  const recentSales = data.salesInvoices.slice(-5).reverse();

  return <div className="space-y-6">
    <PageTitle icon={BarChart3} title={B('MATGR Retail Dashboard', 'لوحة MATGR للبيع والمخازن')} description={B('POS, barcode search, invoice details/actions, products, categories, returns, treasury and advanced reports are available.', 'نقطة البيع والبحث بالباركود وإجراءات الفواتير والأصناف والتصنيفات والمرتجعات والخزينة والتقارير متاحة الآن.')} action={resetButton(reset, L('reset'))} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Receipt}
        label={L('salesTotal')}
        value={formatCurrency(totalSales, language)}
        hint={B('Open active sales invoices', 'اضغط لفتح فواتير البيع النشطة')}
        onClick={() => navigate('/sales-invoices?from=retail-dashboard')}
        ariaLabel={B('Open sales invoices', 'فتح فواتير البيع')}
      />
      <StatCard
        icon={PackagePlus}
        label={L('purchasesTotal')}
        value={formatCurrency(totalPurchases, language)}
        hint={B('Open active purchase invoices', 'اضغط لفتح فواتير المشتريات النشطة')}
        onClick={() => navigate('/purchases?from=retail-dashboard')}
        ariaLabel={B('Open purchase invoices', 'فتح فواتير المشتريات')}
      />
      <StatCard
        icon={WalletCards}
        label={L('treasuryBalance')}
        value={formatCurrency(treasuryBalance(data), language)}
        hint={B('Open treasury movements and balance', 'اضغط لفتح رصيد وحركات الخزينة')}
        onClick={() => navigate('/treasury?from=retail-dashboard')}
        ariaLabel={B('Open treasury', 'فتح الخزينة')}
      />
      <StatCard
        icon={Boxes}
        label={L('estimatedProfit')}
        value={formatCurrency(totalProfit, language)}
        hint={B('Open the detailed profit report', 'اضغط لفتح تقرير الأرباح التفصيلي')}
        onClick={() => navigate('/business-reports?type=profit&from=retail-dashboard')}
        ariaLabel={B('Open profit report', 'فتح تقرير الأرباح')}
      />
    </section>
    <DashboardSalesChart invoices={data.salesInvoices} language={language} />
    <section className="grid gap-6 xl:grid-cols-3">
      <div id="retail-dashboard-recent-sales-card" className="card p-6 xl:col-span-2">
        <div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-lg font-semibold text-primary">{L('recentSalesInvoices')}</h3><Link className="btn-secondary !py-2" to="/sales-invoices">{L('openInvoices')}</Link></div>
        <div id="retail-dashboard-recent-sales-table-wrap" className="table-responsive"><table id="retail-dashboard-recent-sales-table" className="responsive-table w-full text-sm"><thead className="table-head"><tr><th className="px-4 py-3">{B('No.', 'رقم')}</th><th className="px-4 py-3">{L('customer')}</th><th className="px-4 py-3">{L('warehouse')}</th><th className="px-4 py-3">{L('total')}</th><th className="px-4 py-3">{L('due')}</th><th className="px-4 py-3">{L('status')}</th></tr></thead><tbody>{recentSales.map((invoice) => <tr className="border-b border-soft" key={invoice.id}><td className="px-4 py-3 font-medium text-primary">{invoice.number}</td><td className="px-4 py-3 text-muted">{getCustomerName(data, invoice.customerId)}</td><td className="px-4 py-3 text-muted">{getWarehouseName(data, invoice.warehouseId)}</td><td className="px-4 py-3 text-muted">{formatCurrency(invoiceTotal(invoice), language)}</td><td className="px-4 py-3 text-muted">{formatCurrency(invoiceDue(invoice), language)}</td><td className="px-4 py-3"><StatusBadge status={getInvoiceStatus(invoice)} /></td></tr>)}</tbody></table></div>
      </div>
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-primary">{L('quickActions')}</h3>
        <div className="mt-4 grid gap-3">
          <Link className="btn-primary justify-start gap-2" to="/pos"><ShoppingCart className="h-4 w-4" />{L('openPos')}</Link>
          <Link className="btn-secondary justify-start gap-2" to="/purchases"><PackagePlus className="h-4 w-4" />{L('newPurchaseInvoice')}</Link>
          <Link className="btn-secondary justify-start gap-2" to="/business-reports"><BarChart3 className="h-4 w-4" />{L('advancedReports')}</Link>
        </div>
      </div>
    </section>
    <SimpleTable id="dashboard-low-stock" empty={L('noData')} columns={[L('product'), L('category'), L('stock'), L('minStock'), L('status')]} rows={lowRows} renderRow={(product) => <tr key={product.id} className="border-b border-soft"><td className="px-5 py-4 font-medium text-primary">{product.name}</td><td className="px-5 py-4 text-muted">{getCategoryName(data, product.categoryId)}</td><td className="px-5 py-4 text-muted">{getProductStock(product)}</td><td className="px-5 py-4 text-muted">{product.minStock}</td><td className="px-5 py-4"><span className={`badge ${stockTone('low_stock')}`}>{L('lowStock')}</span></td></tr>} />
  </div>;
}

const directoryConfig = {
  categories: { title: 'Categories Management', titleAr: 'إدارة التصنيفات', description: 'Create, edit and delete product categories like the dashboard screenshots.', descriptionAr: 'إضافة وتعديل وحذف تصنيفات الأصناف مثل الاسكرينات المطلوبة.', icon: Tags, collection: 'categories', csv: 'categories.csv', empty: { name: '', description: '', status: 'active' }, fields: ['name', 'description', 'status'] },
  warehouses: { title: 'Warehouses Management', titleAr: 'إدارة المخازن', description: 'Manage store branches, main warehouse and stock locations.', descriptionAr: 'إدارة الفروع والمخزن الرئيسي ومواقع المخزون.', icon: Warehouse, collection: 'warehouses', csv: 'warehouses.csv', empty: { name: '', code: '', address: '', manager: '', phone: '', status: 'active' }, fields: ['name', 'code', 'address', 'manager', 'phone', 'status'] },
  customers: { title: 'Customers Management', titleAr: 'إدارة العملاء', description: 'Manage customers with debit/credit opening balances.', descriptionAr: 'إدارة العملاء مع الأرصدة الافتتاحية دائن/مدين.', icon: UsersRound, collection: 'customers', csv: 'customers.csv', empty: { name: '', phone: '', email: '', address: '', openingBalance: 0, balanceType: 'debit', status: 'active' }, fields: ['name', 'phone', 'email', 'address', 'openingBalance', 'balanceType', 'status'] },
  suppliers: { title: 'Suppliers Management', titleAr: 'إدارة الموردين', description: 'Manage suppliers with opening balances and contact data.', descriptionAr: 'إدارة الموردين والأرصدة الافتتاحية وبيانات التواصل.', icon: Truck, collection: 'suppliers', csv: 'suppliers.csv', empty: { name: '', phone: '', email: '', address: '', openingBalance: 0, balanceType: 'credit', status: 'active' }, fields: ['name', 'phone', 'email', 'address', 'openingBalance', 'balanceType', 'status'] },
};

function DirectoryPage({ kind }) {
  const cfg = directoryConfig[kind];
  const { data, setData } = useRetailStore();
  const { L, language, B } = useRetailCopy();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(cfg.empty);
  const [editingId, setEditingId] = useState('');
  const [stockWarehouse, setStockWarehouse] = useState(null);
  const rows = data[cfg.collection] || [];
  const filtered = useMemo(() => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [rows, query]);

  async function save(event) {
    event.preventDefault();
    try {
      await setData((draft) => {
        if (editingId) draft[cfg.collection] = draft[cfg.collection].map((row) => row.id === editingId ? { ...row, ...form, openingBalance: Number(form.openingBalance || 0) } : row);
        else draft[cfg.collection].push({ ...form, id: makeId(kind.slice(0, 3)), openingBalance: Number(form.openingBalance || 0) });
        return draft;
      });
      setForm(cfg.empty);
      setEditingId('');
      toast.success(L('saved'));
    } catch (error) {
      toast.error(error?.message || B('Backend save failed', 'فشل الحفظ في الخادم'));
    }
  }
  function edit(row) { setEditingId(row.id); setForm({ ...cfg.empty, ...row }); }
  async function remove(id) {
    try {
      await setData((draft) => ({ ...draft, [cfg.collection]: draft[cfg.collection].filter((row) => row.id !== id) }));
      toast.success(L('delete'));
    } catch (error) {
      toast.error(error?.message || B('Backend delete failed', 'فشل الحذف من الخادم'));
    }
  }

  return <div className="space-y-6"><PageTitle icon={cfg.icon} title={language === 'ar' ? cfg.titleAr : cfg.title} description={language === 'ar' ? cfg.descriptionAr : cfg.description} />
    <section className="card p-6"><form onSubmit={save} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{cfg.fields.map((field) => {
      if (field === 'status') return <SelectInput key={field} label={L('status')} value={form.status} onChange={(value) => setForm((c) => ({ ...c, status: value }))}><option value="active">{L('active')}</option><option value="inactive">{L('inactive')}</option></SelectInput>;
      if (field === 'balanceType') return <SelectInput key={field} label={L('balanceType')} value={form.balanceType} onChange={(value) => setForm((c) => ({ ...c, balanceType: value }))}><option value="debit">{L('debit')}</option><option value="credit">{L('credit')}</option></SelectInput>;
      const numeric = field === 'openingBalance';
      return <TextInput key={field} label={L(field) || field} type={numeric ? 'number' : 'text'} min={numeric ? '0' : undefined} value={form[field]} onChange={(value) => setForm((c) => ({ ...c, [field]: value }))} />;
    })}<div className="flex items-end gap-3 xl:col-span-4"><button className="btn-primary gap-2"><Save className="h-4 w-4" />{editingId ? L('update') : L('add')}</button>{editingId ? <button type="button" className="btn-secondary" onClick={() => { setEditingId(''); setForm(cfg.empty); }}>{L('cancel')}</button> : null}</div></form></section>
    <Toolbar query={query} onQuery={setQuery} onExport={() => { exportToCsv(cfg.csv, filtered); toast.success(L('exported')); }} onPrint={() => printElementById(`${kind}-table`, language === 'ar' ? cfg.titleAr : cfg.title)} />
    <SimpleTable id={`${kind}-table`} empty={L('noData')} columns={cfg.collection === 'categories' ? [L('name'), L('description'), L('status'), L('actions')] : [L('name'), L('phone'), L('address'), L('openingBalance'), L('status'), L('actions')]} rows={filtered} renderRow={(row) => cfg.collection === 'categories' ? <tr key={row.id} className="border-b border-soft"><td className="px-5 py-4 font-medium text-primary">{row.name}</td><td className="px-5 py-4 text-muted">{row.description || '—'}</td><td className="px-5 py-4"><StatusBadge status={row.status} /></td><td className="px-5 py-4 no-print"><div className="flex gap-2"><button className="btn-secondary !px-3 !py-2" type="button" onClick={() => edit(row)}>{L('edit')}</button><button className="btn-danger !px-3 !py-2" type="button" onClick={() => remove(row.id)}><Trash2 className="h-4 w-4" /></button></div></td></tr> : <tr key={row.id} className="border-b border-soft"><td className="px-5 py-4"><p className="font-medium text-primary">{row.name}</p><p className="mt-1 text-xs text-muted">{row.code || row.email || ''}</p></td><td className="px-5 py-4 text-muted">{row.phone || '—'}</td><td className="px-5 py-4 text-muted">{row.address || row.manager || '—'}</td><td className="px-5 py-4 text-muted">{row.openingBalance !== undefined ? `${row.balanceType} ${row.openingBalance}` : '—'}</td><td className="px-5 py-4"><StatusBadge status={row.status} /></td><td className="px-5 py-4 no-print"><div className="flex gap-2"><button className="btn-secondary !px-3 !py-2" type="button" onClick={() => edit(row)}>{L('edit')}</button>{cfg.collection === 'warehouses' ? <button className="btn-secondary !px-3 !py-2" type="button" onClick={() => setStockWarehouse(row)}>{L('stock')}</button> : null}<button className="btn-danger !px-3 !py-2" type="button" onClick={() => remove(row.id)}><Trash2 className="h-4 w-4" /></button></div></td></tr>} />
    {stockWarehouse ? <WarehouseStockModal warehouse={stockWarehouse} data={data} onClose={() => setStockWarehouse(null)} /> : null}
  </div>;
}


function WarehouseStockModal({ warehouse, data, onClose }) {
  const { L, language, B } = useRetailCopy();
  const rows = data.products.map((product) => ({
    ...product,
    currentStock: getProductStock(product, warehouse.id),
    stockValue: getProductStock(product, warehouse.id) * Number(product.purchasePrice || 0),
  }));
  const totalQty = rows.reduce((sum, row) => sum + row.currentStock, 0);
  const totalValue = rows.reduce((sum, row) => sum + row.stockValue, 0);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
    <section className="card max-h-[90vh] w-full max-w-5xl overflow-y-auto p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h3 className="text-2xl font-semibold text-primary">{warehouse.name} {L('stock')}</h3><p className="mt-1 text-sm text-muted">{B('Products and quantities currently assigned to this warehouse.', 'الأصناف والكميات الموجودة داخل هذا المخزن حاليًا.')}</p></div>
        <button type="button" className="btn-secondary" onClick={onClose}>{L('close')}</button>
      </div>
      <section className="mt-5 grid gap-4 md:grid-cols-2"><StatCard icon={Boxes} label={L('totalQuantity')} value={totalQty} /><StatCard icon={WalletCards} label={L('purchaseValue')} value={formatCurrency(totalValue, language)} /></section>
      <div id="warehouse-stock-modal-table" className="mt-5 table-responsive rounded-2xl border border-soft">
        <table className="responsive-table w-full text-sm"><thead className="table-head"><tr><th className="px-4 py-3">{L('code')}</th><th className="px-4 py-3">{L('product')}</th><th className="px-4 py-3">{L('category')}</th><th className="px-4 py-3">{L('stock')}</th><th className="px-4 py-3">{L('value')}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-soft"><td className="px-4 py-3 text-muted">{row.code}</td><td className="px-4 py-3 font-medium text-primary">{row.name}</td><td className="px-4 py-3 text-muted">{getCategoryName(data, row.categoryId)}</td><td className="px-4 py-3"><span className={`badge ${row.currentStock <= Number(row.minStock || 0) ? stockTone('low_stock') : stockTone('in_stock')}`}>{row.currentStock}</span></td><td className="px-4 py-3 text-muted">{formatCurrency(row.stockValue, language)}</td></tr>)}</tbody></table>
      </div>
      <div className="mt-5 flex justify-end"><button className="btn-secondary gap-2" type="button" onClick={() => printElementById('warehouse-stock-modal-table', `${warehouse.name} stock`)}><Printer className="h-4 w-4" />{L('print')}</button></div>
    </section>
  </div>;
}

export const CategoriesPage = () => <DirectoryPage kind="categories" />;
export const WarehousesPage = () => <DirectoryPage kind="warehouses" />;
export const CustomersPage = () => <DirectoryPage kind="customers" />;
export const SuppliersPage = () => <DirectoryPage kind="suppliers" />;


export function ProductsCatalogPage() {
  const { data, setData } = useRetailStore();
  const { L, language, B } = useRetailCopy();
  const toast = useToast();
  const blank = {
    code: '', barcode: '', name: '', categoryId: data.categories[0]?.id || '', unit: 'Piece', unitFactor: 1,
    purchasePrice: 0, salePrice: 0, minStock: 0, status: 'active', stock: {}, units: [{ name: 'Piece', factor: 1, salePrice: 0 }],
  };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState('');
  const [query, setQuery] = useState('');
  const [smartQuery, setSmartQuery] = useState('');
  const [importText, setImportText] = useState('');
  const rows = useMemo(() => data.products.filter((product) => `${product.code} ${product.barcode} ${product.name} ${getCategoryName(data, product.categoryId)} ${normalizeProductUnits(product).map((unit) => unit.name).join(' ')}`.toLowerCase().includes(query.toLowerCase()) && smartProductFilter(product, data, smartQuery)), [data, query, smartQuery]);

  function normalizeFormProduct(raw) {
    const units = (raw.units?.length ? raw.units : [{ name: raw.unit || 'Piece', factor: raw.unitFactor || 1, salePrice: raw.salePrice || 0 }])
      .filter((unit) => String(unit.name || '').trim())
      .map((unit) => ({ name: unit.name || 'Piece', factor: Number(unit.factor || 1), salePrice: normalizeMoney(unit.salePrice) }));
    const primary = units[0] || { name: 'Piece', factor: 1, salePrice: 0 };
    return {
      ...raw,
      unit: primary.name,
      unitFactor: Number(primary.factor || 1),
      purchasePrice: normalizeMoney(raw.purchasePrice),
      salePrice: normalizeMoney(raw.salePrice || primary.salePrice),
      minStock: normalizeMoney(raw.minStock),
      stock: raw.stock || {},
      units,
    };
  }

  async function save(event) {
    event.preventDefault();
    const payload = normalizeFormProduct(form);
    try {
      await setData((draft) => {
        if (editingId) draft.products = draft.products.map((row) => row.id === editingId ? { ...row, ...payload } : row);
        else draft.products.push({ ...payload, id: makeId('prd') });
        return draft;
      });
      setEditingId('');
      setForm(blank);
      toast.success(L('saved'));
    } catch (error) {
      toast.error(error?.message || B('Backend save failed', 'فشل الحفظ في الخادم'));
    }
  }

  async function deleteProduct(id) {
    try {
      await setData((draft) => ({ ...draft, products: draft.products.filter((row) => row.id !== id) }));
      toast.success(L('delete'));
    } catch (error) {
      toast.error(error?.message || B('Backend delete failed', 'فشل الحذف من الخادم'));
    }
  }

  function editProduct(product) {
    const units = normalizeProductUnits(product);
    setEditingId(product.id);
    setForm({ ...blank, ...product, units, unit: units[0]?.name || product.unit, unitFactor: units[0]?.factor || product.unitFactor, salePrice: product.salePrice || units[0]?.salePrice || 0 });
  }

  function updateUnit(index, key, value) {
    setForm((current) => ({
      ...current,
      units: (current.units || []).map((unit, unitIndex) => unitIndex === index ? { ...unit, [key]: key === 'name' ? value : normalizeMoney(value) } : unit),
    }));
  }

  function addUnit() {
    setForm((current) => ({ ...current, units: [...(current.units || []), { name: 'Unit', factor: 1, salePrice: current.salePrice || 0 }] }));
  }

  function removeUnit(index) {
    setForm((current) => ({ ...current, units: (current.units || []).filter((_unit, unitIndex) => unitIndex !== index) }));
  }

  function parseImportedProducts() {
    const lines = importText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (!lines.length) return [];
    const firstCells = lines[0].split(',').map((cell) => cell.trim().toLowerCase());
    const hasHeader = ['code', 'barcode', 'name'].some((key) => firstCells.includes(key));
    const header = hasHeader ? firstCells : ['code', 'barcode', 'name', 'category', 'unit', 'purchaseprice', 'saleprice', 'minstock', 'stock'];
    const body = hasHeader ? lines.slice(1) : lines;
    return body.map((line) => {
      const cells = line.split(',').map((cell) => cell.trim());
      const row = Object.fromEntries(header.map((key, index) => [key.replace(/\s+/g, '').toLowerCase(), cells[index] || '']));
      const categoryName = row.category || row.categoryid || data.categories[0]?.name || '';
      const category = data.categories.find((cat) => cat.id === categoryName || cat.name.toLowerCase() === categoryName.toLowerCase()) || data.categories[0];
      const unitName = row.unit || 'Piece';
      const salePrice = normalizeMoney(row.saleprice || row.price || 0);
      return {
        id: makeId('prd'),
        code: row.code || `IMP-${Date.now().toString(36)}`,
        barcode: row.barcode || '',
        name: row.name || B('Imported product', 'صنف مستورد'),
        categoryId: category?.id || data.categories[0]?.id || '',
        unit: unitName,
        unitFactor: normalizeMoney(row.unitfactor || 1) || 1,
        purchasePrice: normalizeMoney(row.purchaseprice || row.cost || 0),
        salePrice,
        minStock: normalizeMoney(row.minstock || 0),
        stock: Object.fromEntries(data.warehouses.map((warehouse, index) => [warehouse.id, index === 0 ? normalizeMoney(row.stock || 0) : 0])),
        units: [{ name: unitName, factor: normalizeMoney(row.unitfactor || 1) || 1, salePrice }],
        status: 'active',
      };
    });
  }

  async function importProducts() {
    const imported = parseImportedProducts();
    if (!imported.length) return;
    try {
      await setData((draft) => { draft.products.push(...imported); return draft; });
      setImportText('');
      toast.success(language === 'ar' ? `تم استيراد ${imported.length} صنف` : `${imported.length} products imported`);
    } catch (error) {
      toast.error(error?.message || B('Backend import failed', 'فشل الاستيراد إلى الخادم'));
    }
  }

  function sampleImport() {
    setImportText(language === 'ar' ? 'code,barcode,name,category,unit,purchasePrice,salePrice,minStock,stock\nP-9001,6229001001,صنف تجريبي,مشروبات,قطعة,20,30,5,25' : 'code,barcode,name,category,unit,purchasePrice,salePrice,minStock,stock\nP-9001,6229001001,Sample Product,Beverages,Piece,20,30,5,25');
  }

  return <div className="space-y-6"><PageTitle icon={Boxes} title={B('Products Catalog', 'كتالوج الأصناف')} description={B('Products include import, price labels, multiple sale units, barcode/code, category, prices, minimum stock and stock by warehouse.', 'الأصناف تشمل الاستيراد وطباعة الأسعار ووحدات بيع متعددة والباركود/الكود والتصنيف والأسعار وحد الطلب والمخزون حسب المخزن.')} />
    <section className="card p-6"><form onSubmit={save} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <TextInput label={L('code')} value={form.code} onChange={(v) => setForm((c) => ({ ...c, code: v }))} />
      <TextInput label={L('barcode')} value={form.barcode} onChange={(v) => setForm((c) => ({ ...c, barcode: v }))} />
      <TextInput label={L('name')} value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} />
      <SelectInput label={L('category')} value={form.categoryId} onChange={(v) => setForm((c) => ({ ...c, categoryId: v }))}>{data.categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</SelectInput>
      <TextInput label={L('purchasePrice')} type="number" min="0" value={form.purchasePrice} onChange={(v) => setForm((c) => ({ ...c, purchasePrice: v }))} />
      <TextInput label={L('salePrice')} type="number" min="0" value={form.salePrice} onChange={(v) => setForm((c) => ({ ...c, salePrice: v, units: (c.units || []).map((unit, index) => index === 0 ? { ...unit, salePrice: normalizeMoney(v) } : unit) }))} />
      <TextInput label={L('minStock')} type="number" min="0" value={form.minStock} onChange={(v) => setForm((c) => ({ ...c, minStock: v }))} />
      <SelectInput label={L('status')} value={form.status} onChange={(v) => setForm((c) => ({ ...c, status: v }))}><option value="active">{L('active')}</option><option value="inactive">{L('inactive')}</option></SelectInput>
      {data.warehouses.map((warehouse) => <TextInput key={warehouse.id} label={`${L('stock')} - ${warehouse.name}`} type="number" min="0" value={form.stock?.[warehouse.id] || 0} onChange={(v) => setForm((c) => ({ ...c, stock: { ...(c.stock || {}), [warehouse.id]: normalizeMoney(v) } }))} />)}
      <div className="xl:col-span-4 sub-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-primary">{L('saleUnits')}</p><p className="text-xs text-muted">{B('Add multiple sale units with conversion factor and sale price.', 'أضف وحدات بيع متعددة مع معامل التحويل وسعر البيع.')}</p></div><button type="button" className="btn-secondary !py-2 gap-2" onClick={addUnit}><Plus className="h-4 w-4" />{L('addUnit')}</button></div>
        <div className="table-responsive"><table className="responsive-table w-full text-sm"><thead className="table-head"><tr><th className="px-4 py-3">{L('unit')}</th><th className="px-4 py-3">{L('unitFactor')}</th><th className="px-4 py-3">{L('salePrice')}</th><th className="px-4 py-3"></th></tr></thead><tbody>{(form.units || []).map((unit, index) => <tr key={`${unit.name}-${index}`} className="border-b border-soft"><td className="px-4 py-3"><input className="input !py-2" value={unit.name} onChange={(e) => updateUnit(index, 'name', e.target.value)} /></td><td className="px-4 py-3"><input className="input !py-2" type="number" min="1" value={unit.factor} onChange={(e) => updateUnit(index, 'factor', e.target.value)} /></td><td className="px-4 py-3"><input className="input !py-2" type="number" min="0" value={unit.salePrice} onChange={(e) => updateUnit(index, 'salePrice', e.target.value)} /></td><td className="px-4 py-3"><button type="button" className="btn-danger !px-3 !py-2" onClick={() => removeUnit(index)} disabled={(form.units || []).length <= 1}><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>
      </div>
      <div className="flex items-end gap-3 xl:col-span-4"><button className="btn-primary gap-2"><Save className="h-4 w-4" />{editingId ? L('update') : L('add')}</button>{editingId ? <button type="button" className="btn-secondary" onClick={() => { setEditingId(''); setForm(blank); }}>{L('cancel')}</button> : null}</div>
    </form></section>

    <section className="card p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start"><div className="flex-1"><h3 className="text-lg font-semibold text-primary">{L('importProducts')}</h3><p className="mt-1 text-sm text-muted">{B('Paste CSV columns: code, barcode, name, category, unit, purchasePrice, salePrice, minStock, stock.', 'الصق أعمدة CSV: الكود، الباركود، الاسم، التصنيف، الوحدة، سعر الشراء، سعر البيع، حد الطلب، المخزون.')}</p><textarea className="input mt-4 min-h-28" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={B('code,barcode,name,category,unit,purchasePrice,salePrice,minStock,stock', 'الكود,الباركود,الاسم,التصنيف,الوحدة,سعر الشراء,سعر البيع,حد الطلب,المخزون')} /></div><div className="flex flex-wrap gap-3 lg:pt-9"><button type="button" className="btn-secondary gap-2" onClick={sampleImport}><FileText className="h-4 w-4" />{L('sample')}</button><button type="button" className="btn-primary gap-2" onClick={importProducts}><Upload className="h-4 w-4" />{L('importProducts')}</button></div></div></section>

    <Toolbar query={query} onQuery={setQuery} onExport={() => { exportToCsv('products.csv', rows); toast.success(L('exported')); }} onPrint={() => printElementById('products-table', B('Products', 'الأصناف'))}>
      <div className="relative min-w-0 xl:w-80">
        <Sparkles className="pointer-events-none absolute start-4 top-3.5 h-4 w-4 text-cyan-500" />
        <input className="input !ps-11" value={smartQuery} onChange={(e) => setSmartQuery(e.target.value)} placeholder={B('Smart filter: low stock, no barcode, profitable', 'فلتر ذكي: مخزون منخفض، بدون باركود، مربح')} />
      </div>
      <button className="btn-secondary gap-2" type="button" onClick={() => printElementById('price-labels', L('printPriceLabels'))}><Barcode className="h-4 w-4" />{L('printPriceLabels')}</button>
    </Toolbar>
    <SimpleTable id="products-table" empty={L('noData')} columns={[L('code'), L('barcode'), L('product'), L('category'), L('purchasePrice'), L('salePrice'), L('units'), L('stock'), L('actions')]} rows={rows} renderRow={(product) => <tr key={product.id} className="border-b border-soft"><td className="px-5 py-4 text-muted">{product.code}</td><td className="px-5 py-4 text-muted">{product.barcode}</td><td className="px-5 py-4"><p className="font-medium text-primary">{product.name}</p><p className="text-xs text-muted">{primaryProductUnit(product).name}</p></td><td className="px-5 py-4 text-muted">{getCategoryName(data, product.categoryId)}</td><td className="px-5 py-4 text-muted">{formatCurrency(product.purchasePrice, language)}</td><td className="px-5 py-4 text-muted">{formatCurrency(product.salePrice, language)}</td><td className="px-5 py-4 text-muted">{normalizeProductUnits(product).map((unit) => `${unit.name} ×${unit.factor}`).join(', ')}</td><td className="px-5 py-4"><span className={`badge ${getProductStock(product) <= Number(product.minStock || 0) ? stockTone('low_stock') : stockTone('in_stock')}`}>{getProductStock(product)}</span></td><td className="px-5 py-4 no-print"><div className="flex gap-2"><button className="btn-secondary !px-3 !py-2" type="button" onClick={() => editProduct(product)}>{L('edit')}</button><button className="btn-danger !px-3 !py-2" type="button" onClick={() => deleteProduct(product.id)}><Trash2 className="h-4 w-4" /></button></div></td></tr>} />

    <section id="price-labels" className="card p-6"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold text-primary">{L('priceLabelsPreview')}</h3><span className="text-sm text-muted">{L('printablePriceCards')}</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{rows.map((product) => <div key={`label-${product.id}`} className="rounded-2xl border-2 border-slate-900 bg-white p-4 text-slate-950"><div className="text-xs font-semibold uppercase tracking-widest">BAHAMAS / MATGR</div><h4 className="mt-2 text-xl font-bold">{product.name}</h4><p className="mt-1 text-xs">{product.code} · {product.barcode || B('No barcode', 'بدون باركود')}</p><div className="mt-4 rounded-xl bg-slate-950 p-3 text-center text-3xl font-black text-white">{formatCurrency(product.salePrice, language)}</div><p className="mt-2 text-center text-xs">{L('unitLabel')}: {primaryProductUnit(product).name}</p></div>)}</div></section>
  </div>;
}

function normalizeScannerToken(value) {
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(value || '')
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)))
    .replace(/[\r\n\t]/g, '')
    .trim()
    .toLowerCase();
}

function InvoiceItemEditor({ data, warehouseId, items, setItems, mode = 'sale' }) {
  const { L, language, B } = useRetailCopy();
  const toast = useToast();
  const [productQuery, setProductQuery] = useState('');
  const [scanValue, setScanValue] = useState('');
  const [serverProducts, setServerProducts] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingCode, setIsAddingCode] = useState(false);
  const scanInputRef = useRef(null);

  const localProducts = useMemo(() => {
    const query = normalizeSmartQuery(productQuery);
    return data.products.filter((product) => {
      if (product.status === 'inactive') return false;
      const text = `${product.name || ''} ${product.code || ''} ${product.barcode || ''} ${getCategoryName(data, product.categoryId) || ''}`.toLowerCase();
      return smartTokenMatch(text, query);
    });
  }, [data, productQuery]);

  useEffect(() => {
    const query = String(productQuery || '').trim();
    if (!query) {
      setServerProducts(null);
      setIsSearching(false);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const rows = await searchRetailProducts(query, { limit: 80 });
        if (!cancelled) setServerProducts(rows);
      } catch (_error) {
        if (!cancelled) setServerProducts(null);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [productQuery]);

  const filteredProducts = useMemo(() => {
    const source = String(productQuery || '').trim() && Array.isArray(serverProducts) ? serverProducts : localProducts;
    const unique = new Map();
    source.forEach((product) => {
      if (product?.id) unique.set(String(product.id), product);
    });
    return Array.from(unique.values());
  }, [localProducts, productQuery, serverProducts]);

  function addItem(product) {
    if (!product?.id) return false;
    const available = warehouseId ? getProductStock(product, warehouseId) : getProductStock(product);
    if (mode === 'sale' && warehouseId && available <= 0) {
      toast.error(B('This product is out of stock in the selected warehouse.', 'هذا الصنف غير متوفر في المخزن المحدد.'));
      return false;
    }
    const price = mode === 'purchase' ? Number(product.purchasePrice || 0) : Number(product.salePrice || 0);
    setItems((current) => current.some((item) => item.productId === product.id)
      ? current.map((item) => item.productId === product.id ? { ...item, qty: Number(item.qty || 0) + 1 } : item)
      : [...current, {
        productId: product.id,
        productName: product.name || '',
        productCode: product.code || '',
        barcode: product.barcode || '',
        qty: 1,
        price,
        discount: 0,
      }]);
    return true;
  }

  async function resolveProduct(rawValue) {
    const token = normalizeScannerToken(rawValue);
    if (!token) return null;

    const exactLocal = data.products.find((row) => [row.barcode, row.code, row.name]
      .some((value) => normalizeScannerToken(value) === token));
    if (exactLocal) return exactLocal;

    try {
      const exactRemote = await lookupRetailProduct(token, { warehouseId });
      if (exactRemote?.id) return exactRemote;
    } catch (error) {
      if (error?.status !== 404) throw error;
    }

    const candidates = await searchRetailProducts(token, { limit: 25 });
    const exactCandidate = candidates.find((row) => [row.barcode, row.code, row.name]
      .some((value) => normalizeScannerToken(value) === token));
    if (exactCandidate) return exactCandidate;
    if (candidates.length === 1) return candidates[0];
    return null;
  }

  async function addByCode(rawValue) {
    const token = normalizeScannerToken(rawValue);
    if (!token) {
      toast.info(B('Enter a barcode, product code or product name first.', 'أدخل الباركود أو كود الصنف أو اسم الصنف أولًا.'));
      return;
    }

    setIsAddingCode(true);
    try {
      const product = await resolveProduct(token);
      if (!product?.id) {
        toast.error(L('barcodeNotFound'));
        return;
      }
      if (addItem(product)) {
        setScanValue('');
        setProductQuery('');
        setServerProducts(null);
        toast.success(B('Product added to the invoice.', 'تمت إضافة الصنف إلى الفاتورة.'));
      }
    } catch (error) {
      toast.error(error?.message || B('Could not search the backend.', 'تعذر البحث في الخادم.'));
    } finally {
      setIsAddingCode(false);
      window.requestAnimationFrame(() => scanInputRef.current?.focus());
    }
  }

  function addFirstSearchResult() {
    if (filteredProducts.length !== 1) return false;
    const product = filteredProducts[0];
    if (product && addItem(product)) {
      setProductQuery('');
      setServerProducts(null);
      toast.success(B('Product added to the invoice.', 'تمت إضافة الصنف إلى الفاتورة.'));
      return true;
    }
    return false;
  }

  async function handlePrimaryAdd() {
    if (String(scanValue || '').trim()) {
      await addByCode(scanValue);
      return;
    }
    if (addFirstSearchResult()) return;
    if (String(productQuery || '').trim()) {
      await addByCode(productQuery);
      return;
    }
    toast.info(B('Enter a barcode or search for a product first.', 'أدخل باركود أو ابحث عن صنف أولًا.'));
  }

  function update(index, key, value) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  }

  function remove(index) {
    setItems((current) => current.filter((_item, itemIndex) => itemIndex !== index));
  }

  const noProductsAtAll = !data.products.length && !String(productQuery || '').trim();
  const noSearchMatches = Boolean(String(productQuery || '').trim()) && !isSearching && !filteredProducts.length;
  const canAdd = Boolean(String(scanValue || '').trim() || String(productQuery || '').trim() || filteredProducts.length);

  return <div className="space-y-4">
    <section className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
      <TextInput
        label={L('search')}
        value={productQuery}
        onChange={setProductQuery}
        placeholder={B('Product name, code, barcode', 'اسم الصنف أو الكود أو الباركود')}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            if (!addFirstSearchResult()) void addByCode(productQuery);
          }
        }}
      />
      <TextInput
        label={L('scan')}
        value={scanValue}
        onChange={setScanValue}
        placeholder={B('Scan barcode then press Enter', 'امسح الباركود ثم اضغط Enter')}
        autoFocus
        inputRef={scanInputRef}
        inputMode="text"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            void addByCode(scanValue);
          }
        }}
      />
      <div className="flex items-end"><button type="button" className="btn-primary w-full gap-2" disabled={!canAdd || isAddingCode} onClick={() => void handlePrimaryAdd()}><Plus className="h-4 w-4" />{isAddingCode ? B('Adding…', 'جارٍ الإضافة…') : L('add')}</button></div>
    </section>

    {isSearching ? <div className="sub-card p-4 text-sm text-muted">{B('Searching products…', 'جارٍ البحث عن الأصناف…')}</div> : null}
    {noProductsAtAll ? <div className="sub-card p-4 text-sm text-muted">{B('No products are registered yet. Add products from the Products page first.', 'لا توجد أصناف مسجلة حتى الآن. أضف الأصناف من صفحة الأصناف أولًا.')}</div> : null}
    {noSearchMatches ? <div className="sub-card p-4 text-sm text-muted">{B('No product matches the search text.', 'لا يوجد صنف مطابق لنص البحث.')}</div> : null}

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filteredProducts.map((product) => {
      const available = warehouseId ? getProductStock(product, warehouseId) : getProductStock(product);
      const unavailableForSale = mode === 'sale' && warehouseId && available <= 0;
      return <button key={product.id} type="button" className="sub-card p-4 text-start transition hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-60" disabled={unavailableForSale} onClick={() => { if (addItem(product)) toast.success(B('Product added to the invoice.', 'تمت إضافة الصنف إلى الفاتورة.')); }}><p className="font-semibold text-primary">{product.name}</p><p className="mt-1 text-xs text-muted">{product.code} · {product.barcode || B('No barcode', 'بدون باركود')}</p><p className="mt-2 text-sm text-muted">{L('price')}: {formatCurrency(mode === 'purchase' ? product.purchasePrice : product.salePrice, language)}</p><p className="text-xs text-soft">{L('available')}: {available}</p></button>;
    })}</div>

    <div className="table-responsive"><table className="responsive-table w-full text-sm"><thead className="table-head"><tr><th className="px-4 py-3">{L('product')}</th><th className="px-4 py-3">{L('qty')}</th><th className="px-4 py-3">{L('price')}</th><th className="px-4 py-3">{L('discount')}</th><th className="px-4 py-3">{L('total')}</th><th className="px-4 py-3"></th></tr></thead><tbody>{items.map((item, index) => <tr key={`${item.productId}-${index}`} className="border-b border-soft"><td className="px-4 py-3 font-medium text-primary">{item.productName || getProductName(data, item.productId)}</td><td className="px-4 py-3"><input className="input !py-2" type="number" min="1" value={item.qty} onChange={(e) => update(index, 'qty', Number(e.target.value || 0))} /></td><td className="px-4 py-3"><input className="input !py-2" type="number" min="0" value={item.price} onChange={(e) => update(index, 'price', Number(e.target.value || 0))} /></td><td className="px-4 py-3"><input className="input !py-2" type="number" min="0" value={item.discount} onChange={(e) => update(index, 'discount', Number(e.target.value || 0))} /></td><td className="px-4 py-3 text-muted">{formatCurrency(invoiceLineTotal(item), language)}</td><td className="px-4 py-3"><button type="button" className="btn-danger !px-3 !py-2" onClick={() => remove(index)}><X className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>
  </div>;
}

export function PosPage() {
  const { data, setData, isSaving, requiresPharmacySelection } = useRetailStore();
  const { L, language, B } = useRetailCopy();
  const toast = useToast();
  const [warehouseId, setWarehouseId] = useState(data.warehouses[0]?.id || '');
  const [customerId, setCustomerId] = useState(data.customers[0]?.id || '');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState('');
  const [lastInvoice, setLastInvoice] = useState(null);

  useEffect(() => {
    const valid = data.warehouses.some((warehouse) => warehouse.id === warehouseId);
    if (!valid) setWarehouseId(data.warehouses[0]?.id || '');
  }, [data.warehouses, warehouseId]);

  useEffect(() => {
    const valid = data.customers.some((customer) => customer.id === customerId);
    if (!valid) setCustomerId(data.customers[0]?.id || '');
  }, [data.customers, customerId]);

  const subtotal = invoiceSubtotal(items);
  const total = Math.max(0, items.reduce((sum, item) => sum + invoiceLineTotal(item), 0) - Number(discount || 0));
  async function saveInvoice() {
    if (requiresPharmacySelection) { toast.error(B('Select a pharmacy first.', 'اختر الصيدلية أولًا.')); return; }
    if (!warehouseId) { toast.error(B('Select a warehouse first.', 'اختر المخزن أولًا.')); return; }
    if (!items.length) { toast.info(B('Add at least one product.', 'أضف صنفًا واحدًا على الأقل.')); return; }
    if (!canApplySale(data, warehouseId, items)) { toast.error(L('insufficient')); return; }
    let createdInvoice = null;
    const previousInvoiceIds = new Set(data.salesInvoices.map((invoice) => invoice.id));
    try {
      const fresh = await setData((draft) => {
        createdInvoice = { id: makeId('sal'), number: nextDocNumber('SAL', draft.salesInvoices), date: todayIso(), warehouseId, customerId, paymentMethod: 'cash', discount: normalizeMoney(discount), paid: normalizeMoney(paid), notes: notes || 'Created from POS', status: 'active', items: items.map((item) => ({ ...item })) };
        draft.salesInvoices.push(createdInvoice);
        applyStockForInvoice(draft, createdInvoice, 'sale');
        return draft;
      });
      const savedInvoice = fresh.salesInvoices.find((invoice) => !previousInvoiceIds.has(invoice.id)) || fresh.salesInvoices[0] || createdInvoice;
      setLastInvoice(savedInvoice);
      setItems([]);
      setDiscount(0);
      setPaid(0);
      setNotes('');
      toast.success(L('savedAndStockUpdated'));
    } catch (error) {
      toast.error(error?.message || B('Backend invoice save failed', 'فشل حفظ الفاتورة في الخادم'));
    }
  }
  function cancelDraft() {
    setItems([]);
    setDiscount(0);
    setPaid(0);
    setNotes('');
    setLastInvoice(null);
    toast.info(L('invoiceDraftCanceled'));
  }
  const previewInvoice = { id: 'draft', number: L('draft'), date: todayIso(), warehouseId, customerId, paymentMethod: 'cash', discount: normalizeMoney(discount), paid: normalizeMoney(paid), notes, status: 'draft', items };
  return <div className="space-y-6"><PageTitle icon={ShoppingCart} title={B('Point of Sale / POS', 'نقطة البيع')} description={B('Create sales invoices with customer, warehouse, product search, barcode-reader input, discount, paid amount, due and print-ready receipt.', 'إنشاء فواتير بيع مع العميل والمخزن والبحث عن الصنف أو قارئ الباركود والخصم والمدفوع والمتبقي ومعاينة الطباعة.')} />
    <section className="grid gap-6 xl:grid-cols-[1fr_25rem]"><div className="card p-6"><div className="grid gap-4 md:grid-cols-2"><SelectInput label={L('warehouse')} value={warehouseId} onChange={setWarehouseId} placeholder={B('Choose warehouse', 'اختر المخزن')} emptyText={B('No warehouses available. Refresh the page.', 'لا توجد مخازن متاحة. حدّث الصفحة.')}>{data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</SelectInput><SelectInput label={L('customer')} value={customerId} onChange={setCustomerId} placeholder={B('Choose customer', 'اختر العميل')} emptyText={B('No customers available. Add a customer first.', 'لا يوجد عملاء متاحون. أضف عميلاً أولًا.')}>{data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</SelectInput></div><div className="mt-6"><InvoiceItemEditor data={data} warehouseId={warehouseId} items={items} setItems={setItems} mode="sale" /></div></div><aside className="card h-fit p-6"><h3 className="text-xl font-semibold text-primary">{L('invoiceSummary')}</h3><div className="mt-5 space-y-3"><div className="flex justify-between"><span className="text-muted">{L('subtotal')}</span><strong>{formatCurrency(subtotal, language)}</strong></div><TextInput label={L('discount')} type="number" min="0" value={discount} onChange={setDiscount} /><TextInput label={L('paid')} type="number" min="0" value={paid} onChange={setPaid} /><TextInput label={L('notes')} value={notes} onChange={setNotes} /><div className="flex justify-between border-t border-soft pt-4"><span className="text-muted">{L('total')}</span><strong>{formatCurrency(total, language)}</strong></div><div className="flex justify-between"><span className="text-muted">{L('due')}</span><strong>{formatCurrency(Math.max(0, total - Number(paid || 0)), language)}</strong></div><button type="button" className="btn-primary w-full gap-2" disabled={isSaving || requiresPharmacySelection || !warehouseId || !items.length} onClick={saveInvoice}><Receipt className="h-4 w-4" />{isSaving ? B('Saving…', 'جارٍ الحفظ…') : L('save')}</button><button type="button" className="btn-secondary w-full gap-2" onClick={() => printElementById('pos-print-preview', B('Sales Invoice', 'فاتورة بيع'))}><Printer className="h-4 w-4" />{L('thermalPrint')}</button><button type="button" className="btn-danger w-full gap-2" onClick={cancelDraft} disabled={!items.length && !discount && !paid && !notes && !lastInvoice}><Ban className="h-4 w-4" />{L('void')}</button></div></aside></section>
    <section className="card p-6"><h3 className="mb-4 text-lg font-semibold text-primary">{L('printPreview')}</h3><InvoicePrintable id="pos-print-preview" data={data} invoice={lastInvoice || previewInvoice} kind="sale" /></section>
  </div>;
}

export function PurchasesPage() {
  const { data, setData, isSaving } = useRetailStore();
  const { L, language, B } = useRetailCopy();
  const toast = useToast();
  const [warehouseId, setWarehouseId] = useState(data.warehouses[0]?.id || '');
  const [supplierId, setSupplierId] = useState(data.suppliers[0]?.id || '');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const valid = data.warehouses.some((warehouse) => warehouse.id === warehouseId);
    if (!valid) setWarehouseId(data.warehouses[0]?.id || '');
  }, [data.warehouses, warehouseId]);

  useEffect(() => {
    const valid = data.suppliers.some((supplier) => supplier.id === supplierId);
    if (!valid) setSupplierId(data.suppliers[0]?.id || '');
  }, [data.suppliers, supplierId]);

  const total = Math.max(0, items.reduce((sum, item) => sum + invoiceLineTotal(item), 0) - Number(discount || 0));
  async function saveInvoice() {
    if (!warehouseId) { toast.error(B('Select a warehouse first.', 'اختر المخزن أولًا.')); return; }
    if (!items.length) { toast.info(B('Add at least one product.', 'أضف صنفًا واحدًا على الأقل.')); return; }
    try {
      await setData((draft) => {
        const invoice = { id: makeId('pur'), number: nextDocNumber('PUR', draft.purchaseInvoices), date: todayIso(), warehouseId, supplierId, paymentMethod: 'cash', discount: normalizeMoney(discount), paid: normalizeMoney(paid), notes: notes || 'Purchase invoice', status: 'active', items: items.map((item) => ({ ...item })) };
        draft.purchaseInvoices.push(invoice);
        applyStockForInvoice(draft, invoice, 'purchase');
        return draft;
      });
      setItems([]);
      setDiscount(0);
      setPaid(0);
      setNotes('');
      toast.success(L('savedAndStockUpdated'));
    } catch (error) {
      toast.error(error?.message || B('Backend invoice save failed', 'فشل حفظ الفاتورة في الخادم'));
    }
  }
  return <div className="space-y-6"><PageTitle icon={PackagePlus} title={B('Purchase Invoice', 'فاتورة مشتريات')} description={B('Create supplier purchase invoices and automatically add quantities to the selected warehouse.', 'إنشاء فواتير شراء للموردين وإضافة الكميات تلقائيًا للمخزن المحدد.')} />
    <section className="card p-6"><div className="grid gap-4 md:grid-cols-2"><SelectInput label={L('warehouse')} value={warehouseId} onChange={setWarehouseId} placeholder={B('Choose warehouse', 'اختر المخزن')} emptyText={B('No warehouses available. Refresh the page.', 'لا توجد مخازن متاحة. حدّث الصفحة.')}>{data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</SelectInput><SelectInput label={L('supplier')} value={supplierId} onChange={setSupplierId} placeholder={B('Choose supplier', 'اختر المورد')} emptyText={B('No suppliers available. Add a supplier first.', 'لا يوجد موردون متاحون. أضف موردًا أولًا.')}>{data.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</SelectInput></div><div className="mt-6"><InvoiceItemEditor data={data} warehouseId={warehouseId} items={items} setItems={setItems} mode="purchase" /></div><div className="mt-6 grid gap-4 md:grid-cols-5"><TextInput label={L('discount')} type="number" min="0" value={discount} onChange={setDiscount} /><TextInput label={L('paid')} type="number" min="0" value={paid} onChange={setPaid} /><TextInput label={L('notes')} value={notes} onChange={setNotes} /><div className="sub-card p-4"><p className="text-sm text-muted">{L('total')}</p><p className="text-2xl font-semibold text-primary">{formatCurrency(total, language)}</p></div><div className="flex items-end"><button type="button" className="btn-primary w-full gap-2" disabled={isSaving || !warehouseId || !items.length} onClick={saveInvoice}><Save className="h-4 w-4" />{isSaving ? B('Saving…', 'جارٍ الحفظ…') : L('save')}</button></div></div></section>
  </div>;
}

function EditInvoiceModal({ data, invoice, kind, onClose, onSave }) {
  const { L, language, B } = useRetailCopy();
  const partyField = kind === 'sale' ? 'customerId' : 'supplierId';
  const [form, setForm] = useState({ ...invoice, items: (invoice.items || []).map((item) => ({ ...item })) });
  const total = invoiceTotal(form);
  return <Modal title={`${L('edit')} ${invoice.number}`} onClose={onClose} wide>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><TextInput label={L('date')} type="date" value={form.date} onChange={(v) => setForm((c) => ({ ...c, date: v }))} /><SelectInput label={L('warehouse')} value={form.warehouseId} onChange={(v) => setForm((c) => ({ ...c, warehouseId: v }))}>{data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</SelectInput>{kind === 'sale' ? <SelectInput label={L('customer')} value={form.customerId} onChange={(v) => setForm((c) => ({ ...c, customerId: v }))}>{data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</SelectInput> : <SelectInput label={L('supplier')} value={form.supplierId} onChange={(v) => setForm((c) => ({ ...c, supplierId: v }))}>{data.suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</SelectInput>}<SelectInput label={L('paymentMethod')} value={form.paymentMethod || 'cash'} onChange={(v) => setForm((c) => ({ ...c, paymentMethod: v }))}><option value="cash">{B('Cash', 'نقدي')}</option><option value="card">{B('Card', 'بطاقة')}</option><option value="bank">{B('Bank', 'تحويل بنكي')}</option><option value="credit">{B('Credit', 'آجل')}</option></SelectInput><TextInput label={L('discount')} type="number" min="0" value={form.discount} onChange={(v) => setForm((c) => ({ ...c, discount: normalizeMoney(v) }))} /><TextInput label={L('paid')} type="number" min="0" value={form.paid} onChange={(v) => setForm((c) => ({ ...c, paid: normalizeMoney(v) }))} /><TextInput label={L('notes')} value={form.notes} onChange={(v) => setForm((c) => ({ ...c, notes: v }))} /><div className="sub-card p-4"><p className="text-sm text-muted">{L('total')}</p><p className="text-2xl font-semibold text-primary">{formatCurrency(total, language)}</p></div></div>
    <div className="mt-6"><InvoiceItemEditor data={data} warehouseId={form.warehouseId} items={form.items} setItems={(next) => setForm((c) => ({ ...c, items: typeof next === 'function' ? next(c.items) : next }))} mode={kind === 'sale' ? 'sale' : 'purchase'} /></div>
    <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" className="btn-secondary" onClick={onClose}>{L('cancel')}</button><button type="button" className="btn-primary gap-2" onClick={() => onSave({ ...form, [partyField]: form[partyField], discount: normalizeMoney(form.discount), paid: normalizeMoney(form.paid), items: form.items.map((item) => ({ ...item, qty: normalizeMoney(item.qty), price: normalizeMoney(item.price), discount: normalizeMoney(item.discount) })) })}><Save className="h-4 w-4" />{L('save')}</button></div>
  </Modal>;
}

function InvoiceDetailsModal({ data, invoice, kind, onClose }) {
  const { L, language } = useRetailCopy();
  const printId = `invoice-print-${invoice.id}`;
  return <Modal title={`${L('details')} · ${invoice.number}`} onClose={onClose} wide>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><div className="sub-card p-4"><p className="text-sm text-muted">{L('party')}</p><p className="font-semibold text-primary">{getInvoicePartyName(data, invoice, kind)}</p></div><div className="sub-card p-4"><p className="text-sm text-muted">{L('warehouse')}</p><p className="font-semibold text-primary">{getWarehouseName(data, invoice.warehouseId)}</p></div><div className="sub-card p-4"><p className="text-sm text-muted">{L('paymentStatus')}</p><PaymentBadge invoice={invoice} /></div><div className="sub-card p-4"><p className="text-sm text-muted">{L('status')}</p><StatusBadge status={getInvoiceStatus(invoice)} /></div></section>
    <div className="mt-6"><InvoicePrintable id={printId} data={data} invoice={invoice} kind={kind} /></div>
    <div className="mt-6 flex flex-wrap justify-end gap-3"><button className="btn-secondary gap-2" type="button" onClick={() => printElementById(printId, invoice.number)}><Printer className="h-4 w-4" />{L('print')}</button><button className="btn-primary" type="button" onClick={onClose}>{L('close')}</button></div>
  </Modal>;
}

export function InvoicesPage() {
  const { data, setData } = useRetailStore();
  const { L, language, B } = useRetailCopy();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [warehouseId, setWarehouseId] = useState('all');
  const [partyId, setPartyId] = useState('all');
  const [status, setStatus] = useState('all');
  const [payment, setPayment] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  const baseRows = useMemo(() => [
    ...data.salesInvoices.map((invoice) => ({ ...invoice, kind: 'sale', party: getCustomerName(data, invoice.customerId), partyId: invoice.customerId })),
    ...data.purchaseInvoices.map((invoice) => ({ ...invoice, kind: 'purchase', party: getSupplierName(data, invoice.supplierId), partyId: invoice.supplierId })),
  ], [data]);
  const filteredParties = type === 'purchase' ? data.suppliers : type === 'sale' ? data.customers : [...data.customers, ...data.suppliers];
  const rows = useMemo(() => baseRows.filter((invoice) => {
    const due = invoiceDue(invoice);
    const paid = normalizeMoney(invoice.paid);
    const paymentOk = payment === 'all' || (payment === 'paid' && due <= 0) || (payment === 'partial' && paid > 0 && due > 0) || (payment === 'unpaid' && paid <= 0 && due > 0);
    const dateOk = (!fromDate || invoice.date >= fromDate) && (!toDate || invoice.date <= toDate);
    return (type === 'all' || invoice.kind === type) && (warehouseId === 'all' || invoice.warehouseId === warehouseId) && (partyId === 'all' || invoice.partyId === partyId) && (status === 'all' || getInvoiceStatus(invoice) === status) && paymentOk && dateOk && invoiceSearchText(data, invoice, invoice.kind).includes(query.toLowerCase());
  }).sort((a, b) => new Date(b.date) - new Date(a.date)), [baseRows, data, query, type, warehouseId, partyId, status, payment, fromDate, toDate]);

  function findOriginal(row) {
    const collection = row.kind === 'sale' ? data.salesInvoices : data.purchaseInvoices;
    return collection.find((invoice) => invoice.id === row.id);
  }
  async function saveEdit(nextInvoice) {
    const kind = editing.kind;
    const collectionName = kind === 'sale' ? 'salesInvoices' : 'purchaseInvoices';
    try {
      await setData((draft) => {
        const oldInvoice = draft[collectionName].find((invoice) => invoice.id === nextInvoice.id);
        if (!oldInvoice) throw new Error(B('Invoice not found', 'الفاتورة غير موجودة'));
        if (kind === 'sale') {
          restoreStockForInvoice(draft, oldInvoice, kind);
          if (!canApplySale(draft, nextInvoice.warehouseId, nextInvoice.items)) throw new Error(L('insufficient'));
          applyStockForInvoice(draft, nextInvoice, kind);
        } else {
          restoreStockForInvoice(draft, oldInvoice, kind);
          applyStockForInvoice(draft, nextInvoice, kind);
        }
        draft[collectionName] = draft[collectionName].map((invoice) => invoice.id === nextInvoice.id ? { ...nextInvoice, status: getInvoiceStatus(invoice) } : invoice);
        return draft;
      });
      setEditing(null);
      toast.success(L('savedAndStockUpdated'));
    } catch (error) {
      toast.error(error?.message || B('Backend update failed', 'فشل التعديل في الخادم'));
    }
  }
  async function cancelInvoice(row) {
    const collectionName = row.kind === 'sale' ? 'salesInvoices' : 'purchaseInvoices';
    try {
      await setData((draft) => {
        const invoice = draft[collectionName].find((item) => item.id === row.id);
        restoreStockForInvoice(draft, invoice, row.kind);
        draft[collectionName] = draft[collectionName].map((item) => item.id === row.id ? { ...item, status: 'canceled', canceledAt: new Date().toISOString() } : item);
        return draft;
      });
      toast.success(L('invoiceCanceled'));
    } catch (error) {
      toast.error(error?.message || B('Backend cancellation failed', 'فشل إلغاء الفاتورة في الخادم'));
    }
  }
  async function deleteInvoice(row) {
    const collectionName = row.kind === 'sale' ? 'salesInvoices' : 'purchaseInvoices';
    try {
      await setData((draft) => {
        const invoice = draft[collectionName].find((item) => item.id === row.id);
        restoreStockForInvoice(draft, invoice, row.kind);
        draft[collectionName] = draft[collectionName].filter((item) => item.id !== row.id);
        return draft;
      });
      toast.success(L('invoiceDeleted'));
    } catch (error) {
      toast.error(error?.message || B('Backend delete failed', 'فشل الحذف من الخادم'));
    }
  }
  function resetFilters() { setQuery(''); setType('all'); setWarehouseId('all'); setPartyId('all'); setStatus('all'); setPayment('all'); setFromDate(''); setToDate(''); }

  return <div className="space-y-6"><PageTitle icon={FileText} title={B('Invoices List', 'قائمة الفواتير')} description={B('Advanced invoice list with details, edit, delete, cancel/void, print and advanced filters.', 'قائمة فواتير متقدمة تشمل التفاصيل والتعديل والحذف وإلغاء الفاتورة والطباعة والفلاتر المتقدمة.')} />
    <Toolbar query={query} onQuery={setQuery} onExport={() => { exportToCsv('invoices.csv', rows); toast.success(L('exported')); }} onPrint={() => printElementById('invoices-table', B('Invoices', 'الفواتير'))}><SelectInput className="w-full xl:max-w-48" value={type} onChange={(nextType) => { setType(nextType); setPartyId('all'); }}><option value="all">{L('all')}</option><option value="sale">{B('Sales', 'مبيعات')}</option><option value="purchase">{B('Purchases', 'مشتريات')}</option></SelectInput><SelectInput className="w-full xl:max-w-56" value={warehouseId} onChange={setWarehouseId}><option value="all">{L('warehouse')}: {L('all')}</option>{data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</SelectInput></Toolbar>
    <section className="card p-5"><p className="mb-4 font-semibold text-primary">{L('advancedFilters')}</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6"><SelectInput label={L('party')} value={partyId} onChange={setPartyId}><option value="all">{L('all')}</option>{filteredParties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}</SelectInput><SelectInput label={L('status')} value={status} onChange={setStatus}><option value="all">{L('all')}</option><option value="active">{L('active')}</option><option value="canceled">{L('canceled')}</option></SelectInput><SelectInput label={L('paymentStatus')} value={payment} onChange={setPayment}><option value="all">{L('all')}</option><option value="paid">{L('fullyPaid')}</option><option value="partial">{L('partial')}</option><option value="unpaid">{L('unpaid')}</option></SelectInput><TextInput label={L('fromDate')} type="date" value={fromDate} onChange={setFromDate} /><TextInput label={L('toDate')} type="date" value={toDate} onChange={setToDate} /><div className="flex items-end"><button type="button" className="btn-secondary w-full" onClick={resetFilters}>{L('resetFilters')}</button></div></div></section>
    <SimpleTable
      id="invoices-table"
      empty={L('noData')}
      columns={[B('Invoice', 'الفاتورة'), B('Party / Warehouse', 'الطرف / المخزن'), B('Payment / Status', 'السداد / الحالة'), B('Amounts', 'المبالغ'), L('actions')]}
      rows={rows}
      renderRow={(invoice) => {
        const warehouseName = getWarehouseName(data, invoice.warehouseId);
        const invoiceDate = formatDate(invoice.date, language);
        const totalAmount = formatCurrency(invoiceTotal(invoice), language);
        const paidAmount = formatCurrency(invoice.paid, language);
        const dueAmount = formatCurrency(invoiceDue(invoice), language);

        return <tr key={`${invoice.kind}-${invoice.id}`} className="border-b border-soft">
          <td className="px-5 py-4" data-label={B('Invoice', 'الفاتورة')}>
            <div className="invoice-doc-cell">
              <div className="invoice-doc-main">
                <span className="invoice-kind-badge border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200">{invoice.kind === 'sale' ? B('Sale', 'بيع') : B('Purchase', 'شراء')}</span>
                <strong className="invoice-number" title={invoice.number}>{invoice.number}</strong>
              </div>
              <span className="invoice-date" title={invoiceDate}>{invoiceDate}</span>
            </div>
          </td>
          <td className="px-5 py-4" data-label={B('Party / Warehouse', 'الطرف / المخزن')}>
            <div className="invoice-meta-stack">
              <span className="invoice-party" title={invoice.party}>{invoice.party}</span>
              <span className="invoice-warehouse" title={warehouseName}>{warehouseName}</span>
            </div>
          </td>
          <td className="px-5 py-4" data-label={B('Payment / Status', 'السداد / الحالة')}>
            <div className="invoice-status-stack"><PaymentBadge invoice={invoice} /><StatusBadge status={getInvoiceStatus(invoice)} /></div>
          </td>
          <td className="px-5 py-4" data-label={B('Amounts', 'المبالغ')}>
            <div className="invoice-amounts">
              <div className="invoice-amount-row"><span className="invoice-amount-label">{L('total')}</span><strong>{totalAmount}</strong></div>
              <div className="invoice-amount-row"><span className="invoice-amount-label">{L('paid')}</span><strong>{paidAmount}</strong></div>
              <div className="invoice-amount-row"><span className="invoice-amount-label">{L('due')}</span><strong>{dueAmount}</strong></div>
            </div>
          </td>
          <td className="px-5 py-4 no-print" data-label={L('actions')}>
            <div className="invoice-actions" aria-label={L('actions')}>
              <button className="btn-icon" title={L('details')} aria-label={L('details')} type="button" onClick={() => setSelected({ invoice: findOriginal(invoice), kind: invoice.kind })}><Eye className="h-4 w-4" /></button>
              <button className="btn-icon" title={L('edit')} aria-label={L('edit')} type="button" disabled={getInvoiceStatus(invoice) === 'canceled'} onClick={() => setEditing({ invoice: findOriginal(invoice), kind: invoice.kind })}><Pencil className="h-4 w-4" /></button>
              <button className="btn-icon" title={L('void')} aria-label={L('void')} type="button" disabled={getInvoiceStatus(invoice) === 'canceled'} onClick={() => cancelInvoice(invoice)}><Ban className="h-4 w-4" /></button>
              <button className="btn-icon-danger" title={L('delete')} aria-label={L('delete')} type="button" onClick={() => deleteInvoice(invoice)}><Trash2 className="h-4 w-4" /></button>
            </div>
          </td>
        </tr>;
      }}
    />
    {selected ? <InvoiceDetailsModal data={data} invoice={selected.invoice} kind={selected.kind} onClose={() => setSelected(null)} /> : null}
    {editing ? <EditInvoiceModal data={data} invoice={editing.invoice} kind={editing.kind} onClose={() => setEditing(null)} onSave={saveEdit} /> : null}
  </div>;
}

export function ReturnsPage() {
  const { data, setData } = useRetailStore();
  const { L, language, B } = useRetailCopy();
  const toast = useToast();
  const [kind, setKind] = useState('sales');
  const sourceRows = kind === 'sales' ? data.salesInvoices.filter((i) => getInvoiceStatus(i) !== 'canceled') : data.purchaseInvoices.filter((i) => getInvoiceStatus(i) !== 'canceled');
  const [invoiceId, setInvoiceId] = useState(sourceRows[0]?.id || '');
  const invoice = sourceRows.find((row) => row.id === invoiceId) || sourceRows[0];
  const [productId, setProductId] = useState(invoice?.items?.[0]?.productId || '');
  const [qty, setQty] = useState(1);
  const [refund, setRefund] = useState(0);
  const [reason, setReason] = useState('');
  useEffect(() => { const rows = kind === 'sales' ? data.salesInvoices.filter((i) => getInvoiceStatus(i) !== 'canceled') : data.purchaseInvoices.filter((i) => getInvoiceStatus(i) !== 'canceled'); const nextInvoice = rows.find((row) => row.id === invoiceId) || rows[0]; if (nextInvoice && nextInvoice.id !== invoiceId) { setInvoiceId(nextInvoice.id); setProductId(nextInvoice.items?.[0]?.productId || ''); } }, [kind, data.salesInvoices, data.purchaseInvoices]);
  async function saveReturn() {
    if (!invoice || !productId) return;
    try {
      await setData((draft) => {
        const ret = { id: makeId('ret'), number: nextDocNumber('RET', draft.returns), kind, invoiceId: invoice.id, invoiceNumber: invoice.number, date: todayIso(), warehouseId: invoice.warehouseId, productId, qty: normalizeMoney(qty), refund: normalizeMoney(refund), reason };
        draft.returns.push(ret);
        if (kind === 'sales') addStock(draft, productId, invoice.warehouseId, qty);
        else removeStock(draft, productId, invoice.warehouseId, qty);
        return draft;
      });
      setReason('');
      toast.success(L('savedAndStockUpdated'));
    } catch (error) {
      toast.error(error?.message || B('Backend return save failed', 'فشل حفظ المرتجع في الخادم'));
    }
  }
  return <div className="space-y-6"><PageTitle icon={RotateCcw} title={B('Returns Management', 'إدارة المرتجعات')} description={B('Create sales returns or purchase returns with reason/refund and automatically reverse stock impact.', 'إنشاء مرتجع بيع أو مرتجع شراء مع السبب والمبلغ المسترد وعكس أثر المخزون تلقائيًا.')} />
    <section className="card p-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6"><SelectInput label={L('type')} value={kind} onChange={(v) => { setKind(v); setInvoiceId(''); setProductId(''); }}><option value="sales">{L('salesReturn')}</option><option value="purchase">{L('purchaseReturn')}</option></SelectInput><SelectInput label={B('Invoice', 'الفاتورة')} value={invoiceId} onChange={(v) => { setInvoiceId(v); const next = sourceRows.find((row) => row.id === v); setProductId(next?.items?.[0]?.productId || ''); }}>{sourceRows.map((row) => <option key={row.id} value={row.id}>{row.number}</option>)}</SelectInput><SelectInput label={L('product')} value={productId} onChange={setProductId}>{(invoice?.items || []).map((item) => <option key={item.productId} value={item.productId}>{getProductName(data, item.productId)}</option>)}</SelectInput><TextInput label={L('qty')} type="number" min="1" value={qty} onChange={setQty} /><TextInput label={L('refund')} type="number" min="0" value={refund} onChange={setRefund} /><TextInput label={L('reason')} value={reason} onChange={setReason} /></div><div className="mt-5"><button className="btn-primary gap-2" type="button" onClick={saveReturn}><Save className="h-4 w-4" />{L('save')}</button></div></section>
    <SimpleTable id="returns-table" empty={L('noData')} columns={[B('No.', 'رقم'), L('date'), L('type'), B('Invoice', 'الفاتورة'), L('product'), L('qty'), L('refund'), L('reason')]} rows={data.returns} renderRow={(row) => <tr key={row.id} className="border-b border-soft"><td className="px-5 py-4 font-medium text-primary">{row.number}</td><td className="px-5 py-4 text-muted">{row.date}</td><td className="px-5 py-4 text-muted">{row.kind === 'sales' ? L('salesReturn') : L('purchaseReturn')}</td><td className="px-5 py-4 text-muted">{row.invoiceNumber || row.invoiceId}</td><td className="px-5 py-4 text-muted">{getProductName(data, row.productId)}</td><td className="px-5 py-4 text-muted">{row.qty}</td><td className="px-5 py-4 text-muted">{formatCurrency(row.refund, language)}</td><td className="px-5 py-4 text-muted">{row.reason || '—'}</td></tr>} />
  </div>;
}

export function TransfersPage() {
  const { data, setData } = useRetailStore();
  const { L, B } = useRetailCopy();
  const toast = useToast();
  const [fromWarehouseId, setFromWarehouseId] = useState(data.warehouses[0]?.id || '');
  const [toWarehouseId, setToWarehouseId] = useState(data.warehouses[1]?.id || data.warehouses[0]?.id || '');
  const [productId, setProductId] = useState(data.products[0]?.id || '');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  async function saveTransfer() {
    if (!productId || fromWarehouseId === toWarehouseId) return;
    const product = data.products.find((row) => row.id === productId);
    if (getProductStock(product, fromWarehouseId) < Number(qty || 0)) { toast.error(L('insufficient')); return; }
    try {
      await setData((draft) => {
        draft.transfers.push({ id: makeId('trn'), number: nextDocNumber('TRN', draft.transfers), date: todayIso(), fromWarehouseId, toWarehouseId, productId, qty: normalizeMoney(qty), notes });
        removeStock(draft, productId, fromWarehouseId, qty);
        addStock(draft, productId, toWarehouseId, qty);
        return draft;
      });
      setNotes('');
      toast.success(L('savedAndStockUpdated'));
    } catch (error) {
      toast.error(error?.message || B('Backend transfer failed', 'فشل التحويل في الخادم'));
    }
  }
  return <div className="space-y-6"><PageTitle icon={ArrowLeftRight} title={B('Warehouse Transfers', 'تحويلات المخازن')} description={B('Transfer product quantities from one warehouse to another with stock validation.', 'تحويل كميات الأصناف من مخزن إلى مخزن آخر مع التحقق من توفر المخزون.')} />
    <section className="card p-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><SelectInput label={L('from') + ' ' + L('warehouse')} value={fromWarehouseId} onChange={setFromWarehouseId}>{data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</SelectInput><SelectInput label={L('to') + ' ' + L('warehouse')} value={toWarehouseId} onChange={setToWarehouseId}>{data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</SelectInput><SelectInput label={L('product')} value={productId} onChange={setProductId}>{data.products.map((product) => <option key={product.id} value={product.id}>{product.name} · {getProductStock(product, fromWarehouseId)} {L('available')}</option>)}</SelectInput><TextInput label={L('qty')} type="number" min="1" value={qty} onChange={setQty} /><TextInput label={L('notes')} value={notes} onChange={setNotes} /></div><div className="mt-5"><button type="button" className="btn-primary gap-2" onClick={saveTransfer}><Save className="h-4 w-4" />{L('save')}</button></div></section>
    <SimpleTable id="transfers-table" empty={L('noData')} columns={[B('No.', 'رقم'), L('date'), L('from'), L('to'), L('product'), L('qty'), L('notes')]} rows={data.transfers} renderRow={(row) => <tr key={row.id} className="border-b border-soft"><td className="px-5 py-4 font-medium text-primary">{row.number}</td><td className="px-5 py-4 text-muted">{row.date}</td><td className="px-5 py-4 text-muted">{getWarehouseName(data, row.fromWarehouseId)}</td><td className="px-5 py-4 text-muted">{getWarehouseName(data, row.toWarehouseId)}</td><td className="px-5 py-4 text-muted">{getProductName(data, row.productId)}</td><td className="px-5 py-4 text-muted">{row.qty}</td><td className="px-5 py-4 text-muted">{row.notes || '—'}</td></tr>} />
  </div>;
}


export function InventoryCountPage() {
  const { data, setData } = useRetailStore();
  const { L, language, B } = useRetailCopy();
  const toast = useToast();
  const [warehouseId, setWarehouseId] = useState(data.warehouses[0]?.id || '');
  const [query, setQuery] = useState('');
  const [counts, setCounts] = useState({});
  const [notes, setNotes] = useState('');
  const [summaryMode, setSummaryMode] = useState('all');
  const warehouseSelectRef = useRef(null);
  const tableRef = useRef(null);

  useEffect(() => {
    const valid = data.warehouses.some((warehouse) => warehouse.id === warehouseId);
    if (!valid) setWarehouseId(data.warehouses[0]?.id || '');
  }, [data.warehouses, warehouseId]);

  const allRows = useMemo(() => data.products
    .filter((product) => `${product.code} ${product.barcode} ${product.name} ${getCategoryName(data, product.categoryId)}`.toLowerCase().includes(query.toLowerCase()))
    .map((product) => {
      const current = getProductStock(product, warehouseId);
      const counted = counts[product.id] === undefined ? current : Number(counts[product.id] || 0);
      return { ...product, current, counted, difference: counted - current };
    }), [data, warehouseId, query, counts]);

  const rows = useMemo(() => {
    if (summaryMode === 'changed') return allRows.filter((row) => row.difference !== 0);
    if (summaryMode === 'surplus') return allRows.filter((row) => row.difference > 0);
    if (summaryMode === 'shortage') return allRows.filter((row) => row.difference < 0);
    return allRows;
  }, [allRows, summaryMode]);

  const totalDifference = allRows.reduce((sum, row) => sum + row.difference, 0);
  const changedRows = allRows.filter((row) => row.difference !== 0);

  function scrollToTable() {
    window.requestAnimationFrame(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function chooseSummary(mode) {
    setSummaryMode(mode);
    scrollToTable();
  }

  function loadCurrentStock() {
    setCounts(Object.fromEntries(data.products.map((product) => [product.id, getProductStock(product, warehouseId)])));
    setSummaryMode('all');
    toast.info(B('Current warehouse quantities loaded.', 'تم تحميل الكميات الحالية للمخزن.'));
  }

  async function applyStocktake() {
    if (!warehouseId) { toast.error(B('Select a warehouse first.', 'اختر المخزن أولًا.')); return; }
    try {
      await setData((draft) => {
        const adjustmentRows = changedRows.map((row) => ({ productId: row.id, current: row.current, counted: row.counted, difference: row.difference }));
        draft.inventoryCounts = draft.inventoryCounts || [];
        draft.inventoryCounts.push({ id: makeId('stk'), number: nextDocNumber('STK', draft.inventoryCounts), date: todayIso(), warehouseId, notes, items: adjustmentRows });
        adjustmentRows.forEach((row) => {
          const product = draft.products.find((item) => item.id === row.productId);
          if (product) {
            product.stock = product.stock || {};
            product.stock[warehouseId] = Number(row.counted || 0);
          }
        });
        return draft;
      });
      setNotes('');
      setCounts({});
      setSummaryMode('all');
      toast.success(B('Stocktake applied and stock adjusted', 'تم تطبيق الجرد وتعديل المخزون'));
    } catch (error) {
      toast.error(error?.message || B('Backend stocktake failed', 'فشل تطبيق الجرد في الخادم'));
    }
  }

  return <div className="space-y-6"><PageTitle icon={ClipboardCheck} title={B('Inventory Stocktake', 'جرد المخزون')} description={B('Load products by warehouse, enter counted quantity, calculate shortage/surplus and apply the stocktake results.', 'تحميل الأصناف حسب المخزن وإدخال الكمية المعدودة وحساب العجز/الزيادة وتطبيق نتيجة الجرد.')} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Warehouse}
        label={L('warehouse')}
        value={(
          <span
            className="block max-w-full whitespace-normal break-normal text-lg leading-7 [overflow-wrap:normal] [word-break:normal] hyphens-none md:text-xl"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            title={localizeWarehouseNameForCard(getWarehouseName(data, warehouseId), language)}
          >
            {localizeWarehouseNameForCard(getWarehouseName(data, warehouseId), language)}
          </span>
        )}
        hint={B('Click to choose a warehouse', 'اضغط لاختيار المخزن')}
        onClick={() => { setSummaryMode('all'); warehouseSelectRef.current?.querySelector('select')?.focus(); warehouseSelectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
      />
      <StatCard icon={Boxes} label={L('products')} value={allRows.length} hint={B('Show all counted products', 'عرض كل الأصناف')} active={summaryMode === 'all'} onClick={() => chooseSummary('all')} />
      <StatCard icon={ArrowLeftRight} label={B('Changed items', 'أصناف متغيرة')} value={changedRows.length} hint={B('Show shortage and surplus only', 'عرض العجز والزيادة فقط')} active={summaryMode === 'changed'} onClick={() => chooseSummary('changed')} />
      <StatCard icon={BarChart3} label={L('netDiff')} value={totalDifference} hint={totalDifference > 0 ? B('Show surplus items', 'عرض الأصناف الزائدة') : totalDifference < 0 ? B('Show shortage items', 'عرض الأصناف الناقصة') : B('No net difference', 'لا يوجد فرق صافي')} active={summaryMode === (totalDifference > 0 ? 'surplus' : totalDifference < 0 ? 'shortage' : 'changed')} onClick={() => chooseSummary(totalDifference > 0 ? 'surplus' : totalDifference < 0 ? 'shortage' : 'changed')} />
    </section>
    <section className="card p-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <div ref={warehouseSelectRef}><SelectInput label={L('warehouse')} value={warehouseId} onChange={(value) => { setWarehouseId(value); setCounts({}); setSummaryMode('all'); }} placeholder={B('Choose warehouse', 'اختر المخزن')} emptyText={B('No warehouses available. Refresh the page.', 'لا توجد مخازن متاحة. حدّث الصفحة.')}>{data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</SelectInput></div>
      <TextInput label={L('search')} value={query} onChange={setQuery} placeholder={B('Product/code/barcode', 'الصنف/الكود/الباركود')} />
      <div className="xl:col-span-2"><TextInput label={L('notes')} value={notes} onChange={setNotes} /></div>
      <div className="flex items-end gap-3"><button type="button" className="btn-secondary w-full" onClick={loadCurrentStock} disabled={!warehouseId}>{B('Load current', 'تحميل الحالي')}</button><button type="button" className="btn-primary w-full" onClick={applyStocktake} disabled={!warehouseId || !changedRows.length}>{B('Apply', 'تطبيق')}</button></div>
    </div></section>
    <div ref={tableRef}><SimpleTable id="inventory-count-table" empty={L('noData')} columns={[L('code'), L('product'), L('warehouse'), L('currentQty'), L('countedQty'), L('difference'), L('valueImpact')]} rows={rows} renderRow={(row) => <tr key={row.id} className="border-b border-soft"><td className="px-5 py-4 text-muted">{row.code}</td><td className="px-5 py-4"><p className="font-medium text-primary">{row.name}</p><p className="text-xs text-muted">{row.barcode}</p></td><td className="px-5 py-4 text-muted">{getWarehouseName(data, warehouseId)}</td><td className="px-5 py-4 text-muted">{row.current}</td><td className="px-5 py-4"><input className="input !py-2" type="number" min="0" value={row.counted} onChange={(e) => setCounts((current) => ({ ...current, [row.id]: Number(e.target.value || 0) }))} /></td><td className="px-5 py-4"><span className={`badge ${row.difference === 0 ? stockTone('in_stock') : row.difference > 0 ? 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200' : stockTone('low_stock')}`}>{row.difference}</span></td><td className="px-5 py-4 text-muted">{formatCurrency(row.difference * Number(row.purchasePrice || 0), language)}</td></tr>} /></div>
    <section className="card p-6"><div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-semibold text-primary">{L('previousStocktakes')}</h3><button className="btn-secondary gap-2" type="button" onClick={() => printElementById('stocktake-history', L('previousStocktakes'))}><Printer className="h-4 w-4" />{L('print')}</button></div><div id="stocktake-history" className="table-responsive"><table className="responsive-table w-full text-sm"><thead className="table-head"><tr><th className="px-4 py-3">{B('No.', 'رقم')}</th><th className="px-4 py-3">{L('date')}</th><th className="px-4 py-3">{L('warehouse')}</th><th className="px-4 py-3">{L('items')}</th><th className="px-4 py-3">{L('netDiff')}</th><th className="px-4 py-3">{L('notes')}</th></tr></thead><tbody>{(data.inventoryCounts || []).slice().reverse().map((row) => <tr key={row.id} className="border-b border-soft"><td className="px-4 py-3 font-medium text-primary">{row.number}</td><td className="px-4 py-3 text-muted">{row.date}</td><td className="px-4 py-3 text-muted">{getWarehouseName(data, row.warehouseId)}</td><td className="px-4 py-3 text-muted">{row.items?.length || 0}</td><td className="px-4 py-3 text-muted">{(row.items || []).reduce((sum, item) => sum + Number(item.difference || 0), 0)}</td><td className="px-4 py-3 text-muted">{row.notes || '—'}</td></tr>)}</tbody></table></div></section>
  </div>;
}


export function TreasuryPage() {
  const { data, setData } = useRetailStore();
  const { L, language, B } = useRetailCopy();
  const toast = useToast();
  const [form, setForm] = useState({ date: todayIso(), type: 'income', category: '', amount: 0, description: '', warehouseId: data.warehouses[0]?.id || '' });
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [summaryFilter, setSummaryFilter] = useState('balance');
  const tableRef = useRef(null);

  useEffect(() => {
    const valid = !form.warehouseId || data.warehouses.some((warehouse) => warehouse.id === form.warehouseId);
    if (!valid && data.warehouses.length) setForm((current) => ({ ...current, warehouseId: data.warehouses[0].id }));
  }, [data.warehouses, form.warehouseId]);

  const allRows = [
    ...data.salesInvoices.filter((i) => getInvoiceStatus(i) !== 'canceled').map((invoice) => ({ id: `sale-${invoice.id}`, date: invoice.date, type: 'income', warehouseId: invoice.warehouseId, category: `${B('Sales', 'مبيعات')} ${invoice.number}`, amount: Number(invoice.paid || 0), description: getCustomerName(data, invoice.customerId) })),
    ...data.purchaseInvoices.filter((i) => getInvoiceStatus(i) !== 'canceled').map((invoice) => ({ id: `pur-${invoice.id}`, date: invoice.date, type: 'expense', warehouseId: invoice.warehouseId, category: `${B('Purchase', 'مشتريات')} ${invoice.number}`, amount: Number(invoice.paid || 0), description: getSupplierName(data, invoice.supplierId) })),
    ...(data.returns || []).map((row) => ({ id: `ret-${row.id}`, date: row.date, type: row.kind === 'sales' ? 'expense' : 'income', warehouseId: row.warehouseId, category: `${B('Return', 'مرتجع')} ${row.number}`, amount: Number(row.refund || 0), description: row.reason || row.invoiceNumber || row.invoiceId })),
    ...(data.treasury.movements || []).map((row) => ({ ...row, warehouseId: row.warehouseId || '' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const contextRows = allRows.filter((row) => {
    const haystack = `${row.date} ${row.type} ${row.category} ${row.description} ${getWarehouseName(data, row.warehouseId)}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (!fromDate || row.date >= fromDate) && (!toDate || row.date <= toDate) && (warehouseFilter === 'all' || row.warehouseId === warehouseFilter);
  });

  const autoRows = contextRows.filter((row) => typeFilter === 'all' || row.type === typeFilter);

  async function saveMovement(event) {
    event.preventDefault();
    if (!String(form.category || '').trim() || Number(form.amount || 0) <= 0) {
      toast.warning(B('Enter a category and an amount greater than zero.', 'أدخل التصنيف ومبلغًا أكبر من صفر.'));
      return;
    }
    try {
      await setData((draft) => { draft.treasury.movements.push({ ...form, id: makeId('mov'), amount: Number(form.amount || 0) }); return draft; });
      setForm({ date: todayIso(), type: 'income', category: '', amount: 0, description: '', warehouseId: data.warehouses[0]?.id || '' });
      toast.success(L('saved'));
    } catch (error) {
      toast.error(error?.message || B('Backend save failed', 'فشل الحفظ في الخادم'));
    }
  }

  function clearFilters() {
    setQuery(''); setFromDate(''); setToDate(''); setTypeFilter('all'); setWarehouseFilter('all'); setSummaryFilter('balance');
  }

  function selectSummary(kind) {
    setSummaryFilter(kind);
    if (kind === 'balance' || kind === 'net') setTypeFilter('all');
    if (kind === 'income') setTypeFilter('income');
    if (kind === 'expense') setTypeFilter('expense');
    if (kind === 'balance') {
      setQuery(''); setFromDate(''); setToDate(''); setWarehouseFilter('all');
    }
    window.requestAnimationFrame(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  const incomeTotal = contextRows.filter((row) => row.type === 'income').reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const expenseTotal = contextRows.filter((row) => row.type === 'expense').reduce((sum, row) => sum + Number(row.amount || 0), 0);

  return <div className="space-y-6"><PageTitle icon={WalletCards} title={B('Treasury / Cashbox', 'الخزينة')} description={B('Track treasury balance, manual income, expenses, invoice cash movements and returns impact with MATGR-style date/type/warehouse filters.', 'متابعة رصيد الخزينة والإيرادات والمصروفات وحركات الفواتير والمرتجعات مع فلاتر التاريخ والنوع والمخزن.')} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={WalletCards} label={B('Current balance', 'الرصيد الحالي')} value={formatCurrency(treasuryBalance(data), language)} hint={B('Show all treasury movements', 'عرض كل حركات الخزينة')} active={summaryFilter === 'balance'} onClick={() => selectSummary('balance')} />
      <StatCard icon={Receipt} label={B('Filtered income', 'الإيراد المفلتر')} value={formatCurrency(incomeTotal, language)} hint={B('Filter the table to income', 'تصفية الجدول على الإيرادات')} active={summaryFilter === 'income'} onClick={() => selectSummary('income')} />
      <StatCard icon={PackagePlus} label={B('Filtered expenses', 'المصروف المفلتر')} value={formatCurrency(expenseTotal, language)} hint={B('Filter the table to expenses', 'تصفية الجدول على المصروفات')} active={summaryFilter === 'expense'} onClick={() => selectSummary('expense')} />
      <StatCard icon={BarChart3} label={B('Filtered net', 'الصافي المفلتر')} value={formatCurrency(incomeTotal - expenseTotal, language)} hint={B('Show income and expenses together', 'عرض الإيرادات والمصروفات معًا')} active={summaryFilter === 'net'} onClick={() => selectSummary('net')} />
    </section>
    <section className="card p-6"><form onSubmit={saveMovement} className="grid gap-4 md:grid-cols-2 xl:grid-cols-6"><TextInput label={L('date')} type="date" value={form.date} onChange={(v) => setForm((c) => ({ ...c, date: v }))} /><SelectInput label={L('type')} value={form.type} onChange={(v) => setForm((c) => ({ ...c, type: v }))}><option value="income">{L('income')}</option><option value="expense">{L('expense')}</option></SelectInput><SelectInput label={L('warehouse')} value={form.warehouseId} onChange={(v) => setForm((c) => ({ ...c, warehouseId: v }))}><option value="">{B('General', 'عام')}</option>{data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</SelectInput><TextInput label={L('category')} value={form.category} onChange={(v) => setForm((c) => ({ ...c, category: v }))} /><TextInput label={L('amount')} type="number" min="0" value={form.amount} onChange={(v) => setForm((c) => ({ ...c, amount: v }))} /><div className="flex items-end"><button className="btn-primary w-full gap-2"><Save className="h-4 w-4" />{L('save')}</button></div><div className="md:col-span-2 xl:col-span-6"><TextInput label={L('description')} value={form.description} onChange={(v) => setForm((c) => ({ ...c, description: v }))} /></div></form></section>
    <section className="card p-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-8"><TextInput label={L('search')} value={query} onChange={setQuery} /><TextInput label={L('fromDate')} type="date" value={fromDate} onChange={setFromDate} /><TextInput label={L('toDate')} type="date" value={toDate} onChange={setToDate} /><SelectInput label={L('type')} value={typeFilter} onChange={(value) => { setTypeFilter(value); setSummaryFilter(value === 'income' ? 'income' : value === 'expense' ? 'expense' : 'net'); }}><option value="all">{L('all')}</option><option value="income">{L('income')}</option><option value="expense">{L('expense')}</option></SelectInput><SelectInput label={L('warehouse')} value={warehouseFilter} onChange={setWarehouseFilter}><option value="all">{L('all')}</option>{data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</SelectInput><div className="flex items-end"><button className="btn-secondary w-full whitespace-nowrap" type="button" onClick={clearFilters}>{L('resetFilters')}</button></div><div className="treasury-filter-actions flex items-end gap-2 xl:col-span-2"><button className="btn-secondary w-full gap-2 whitespace-nowrap" type="button" onClick={() => { exportToCsv('treasury.csv', autoRows); toast.success(L('exported')); }}><Download className="h-4 w-4 shrink-0" />{L('export')}</button><button className="btn-secondary w-full gap-2 whitespace-nowrap" type="button" onClick={() => printElementById('treasury-table', L('treasuryReport'))}><Printer className="h-4 w-4 shrink-0" />{L('print')}</button></div></div></section>
    <div ref={tableRef}><SimpleTable id="treasury-table" empty={L('noData')} columns={[L('date'), L('type'), L('warehouse'), L('category'), L('amount'), L('description')]} rows={autoRows} renderRow={(row) => <tr key={row.id} className="border-b border-soft"><td className="px-5 py-4 text-muted">{row.date}</td><td className="px-5 py-4"><span className={`badge ${row.type === 'income' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200' : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200'}`}>{row.type === 'income' ? L('income') : L('expense')}</span></td><td className="px-5 py-4 text-muted">{getWarehouseName(data, row.warehouseId)}</td><td className="px-5 py-4 text-muted">{row.category}</td><td className="px-5 py-4 text-muted">{formatCurrency(row.amount, language)}</td><td className="px-5 py-4 text-muted">{row.description}</td></tr>} /></div>
  </div>;
}

export function ReportsPage() {
  const { data, requiresPharmacySelection, selectedPharmacyId } = useRetailStore();
  const { L, language, B } = useRetailCopy();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const allowedReportTypes = ['sales', 'stock', 'profit', 'purchases', 'customers', 'suppliers', 'treasury', 'movement'];
  const requestedReportType = searchParams.get('type');
  const [reportType, setReportType] = useState(allowedReportTypes.includes(requestedReportType) ? requestedReportType : 'sales');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [warehouseId, setWarehouseId] = useState('all');
  const [serverReport, setServerReport] = useState({ type: 'sales', data: [], summary: {} });
  const [isLoadingReport, setIsLoadingReport] = useState(true);
  const [reportError, setReportError] = useState('');
  const reportResultsRef = useRef(null);

  function selectReport(type) {
    if (!allowedReportTypes.includes(type)) return;
    setReportType(type);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('type', type);
      return next;
    }, { replace: true });
    window.requestAnimationFrame(() => reportResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  useEffect(() => {
    const type = searchParams.get('type');
    if (allowedReportTypes.includes(type) && type !== reportType) setReportType(type);
  }, [searchParams]);

  const backendReportType = reportType === 'profit' ? 'profits' : reportType === 'movement' ? 'stock-movement' : reportType;

  useEffect(() => {
    let cancelled = false;
    if (requiresPharmacySelection) {
      setServerReport({ type: backendReportType, data: [], summary: {} });
      setReportError('');
      setIsLoadingReport(false);
      return () => { cancelled = true; };
    }
    const params = new URLSearchParams({ type: backendReportType });
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    if (warehouseId !== 'all') params.set('warehouseId', warehouseId);
    setIsLoadingReport(true);
    setReportError('');
    getJson(`/business-reports?${params.toString()}`)
      .then((payload) => {
        if (!cancelled) setServerReport(extractObject(payload, { type: backendReportType, data: [], summary: {} }));
      })
      .catch((error) => {
        if (!cancelled) {
          setServerReport({ type: backendReportType, data: [], summary: {} });
          setReportError(error?.message || B('Could not load the report from the backend.', 'تعذر تحميل التقرير من الخادم.'));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingReport(false);
      });
    return () => { cancelled = true; };
  }, [backendReportType, fromDate, toDate, warehouseId, requiresPharmacySelection, selectedPharmacyId]);

  const activeSales = data.salesInvoices.filter((invoice) => getInvoiceStatus(invoice) !== 'canceled');
  const activePurchases = data.purchaseInvoices.filter((invoice) => getInvoiceStatus(invoice) !== 'canceled');
  const totalSales = activeSales.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const totalPurchases = activePurchases.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
  const totalProfit = activeSales.reduce((sum, invoice) => sum + profitForInvoice(data, invoice), 0);

  const report = useMemo(() => {
    const C = {
      date: L('date'), invoice: B('Invoice', 'الفاتورة'), customer: L('customer'), supplier: L('supplier'), warehouse: L('warehouse'), total: L('total'), paid: L('paid'), due: L('due'), sales: B('Sales', 'المبيعات'), profit: L('profit'), product: L('product'), category: L('category'), stock: L('stock'), minStock: L('minStock'), purchaseValue: L('purchaseValue'), saleValue: B('Sale value', 'قيمة البيع'), phone: L('phone'), openingBalance: L('openingBalance'), salesDue: L('salesDue'), purchaseDue: L('purchaseDue'), balanceType: L('balanceType'), type: L('type'), source: L('source'), amount: L('amount'), reference: L('reference'), qty: L('qty')
    };
    const rows = Array.isArray(serverReport.data) ? serverReport.data : [];
    const dateOnly = (value) => String(value || '').slice(0, 10);

    if (reportType === 'sales') return {
      columns: [C.date, C.invoice, C.customer, C.warehouse, C.total, C.paid, C.due],
      rows: rows.map((invoice) => ({ [C.date]: dateOnly(invoice.date), [C.invoice]: invoice.number, [C.customer]: invoice.customer || '—', [C.warehouse]: invoice.warehouse || '—', [C.total]: formatCurrency(invoice.total, language), [C.paid]: formatCurrency(invoice.paid, language), [C.due]: formatCurrency(invoice.due, language) })),
    };
    if (reportType === 'purchases') return {
      columns: [C.date, C.invoice, C.supplier, C.warehouse, C.total, C.paid, C.due],
      rows: rows.map((invoice) => ({ [C.date]: dateOnly(invoice.date), [C.invoice]: invoice.number, [C.supplier]: invoice.supplier || '—', [C.warehouse]: invoice.warehouse || '—', [C.total]: formatCurrency(invoice.total, language), [C.paid]: formatCurrency(invoice.paid, language), [C.due]: formatCurrency(invoice.due, language) })),
    };
    if (reportType === 'profit') return {
      columns: [C.date, C.invoice, C.customer, C.sales, C.profit],
      rows: rows.map((invoice) => ({ [C.date]: dateOnly(invoice.date), [C.invoice]: invoice.number, [C.customer]: invoice.customer || '—', [C.sales]: formatCurrency(invoice.total, language), [C.profit]: formatCurrency(invoice.profit, language) })),
    };
    if (reportType === 'stock') return {
      columns: [C.product, C.category, C.warehouse, C.stock, C.minStock, C.purchaseValue, C.saleValue],
      rows: rows.flatMap((product) => {
        const stockEntries = Object.entries(product.stock || {});
        if (!stockEntries.length) return [{ [C.product]: product.name, [C.category]: product.category || '—', [C.warehouse]: warehouseId === 'all' ? B('All warehouses', 'كل المخازن') : getWarehouseName(data, warehouseId), [C.stock]: 0, [C.minStock]: product.minStock ?? product.min_stock ?? 0, [C.purchaseValue]: formatCurrency(0, language), [C.saleValue]: formatCurrency(0, language) }];
        return stockEntries.map(([stockWarehouseId, quantity]) => ({
          [C.product]: product.name,
          [C.category]: product.category || '—',
          [C.warehouse]: getWarehouseName(data, stockWarehouseId),
          [C.stock]: Number(quantity || 0),
          [C.minStock]: product.minStock ?? product.min_stock ?? 0,
          [C.purchaseValue]: formatCurrency(Number(quantity || 0) * Number(product.purchasePrice ?? product.purchase_price ?? 0), language),
          [C.saleValue]: formatCurrency(Number(quantity || 0) * Number(product.salePrice ?? product.sale_price ?? 0), language),
        }));
      }),
    };
    if (reportType === 'customers') return {
      columns: [C.customer, C.phone, C.openingBalance, C.salesDue, C.balanceType],
      rows: rows.map((customer) => ({ [C.customer]: customer.name, [C.phone]: customer.phone || '—', [C.openingBalance]: formatCurrency(customer.openingBalance ?? customer.opening_balance, language), [C.salesDue]: formatCurrency(customer.due, language), [C.balanceType]: customer.balanceType === 'debit' || customer.balance_type === 'debit' ? L('debit') : L('credit') })),
    };
    if (reportType === 'suppliers') return {
      columns: [C.supplier, C.phone, C.openingBalance, C.purchaseDue, C.balanceType],
      rows: rows.map((supplier) => ({ [C.supplier]: supplier.name, [C.phone]: supplier.phone || '—', [C.openingBalance]: formatCurrency(supplier.openingBalance ?? supplier.opening_balance, language), [C.purchaseDue]: formatCurrency(supplier.due, language), [C.balanceType]: supplier.balanceType === 'debit' || supplier.balance_type === 'debit' ? L('debit') : L('credit') })),
    };
    if (reportType === 'treasury') return {
      columns: [C.date, C.type, C.warehouse, C.source, C.amount, C.reference],
      rows: rows.map((item) => ({ [C.date]: dateOnly(item.date), [C.type]: item.type === 'income' ? L('income') : L('expense'), [C.warehouse]: item.warehouse || B('General', 'عام'), [C.source]: item.category, [C.amount]: formatCurrency(item.amount, language), [C.reference]: item.description || '—' })),
    };

    const movementData = serverReport.data && !Array.isArray(serverReport.data) ? serverReport.data : {};
    const movementRows = [];
    for (const invoice of movementData.invoices || []) {
      for (const item of invoice.items || []) movementRows.push({
        [C.date]: dateOnly(invoice.date),
        [C.type]: invoice.kind === 'sale' ? B('Sale', 'بيع') : B('Purchase', 'شراء'),
        [C.reference]: invoice.number,
        [C.warehouse]: invoice.warehouse || '—',
        [C.product]: item.name || '—',
        [C.qty]: (invoice.kind === 'sale' ? -1 : 1) * Number(item.qty || 0) * Number(item.unitFactor || item.unit_factor || 1),
      });
    }
    for (const itemReturn of movementData.returns || []) {
      for (const item of itemReturn.items || []) movementRows.push({
        [C.date]: dateOnly(itemReturn.date),
        [C.type]: itemReturn.kind === 'sales' ? L('salesReturn') : L('purchaseReturn'),
        [C.reference]: itemReturn.number,
        [C.warehouse]: itemReturn.warehouse || '—',
        [C.product]: item.product || '—',
        [C.qty]: (itemReturn.kind === 'sales' ? 1 : -1) * Number(item.qty || 0),
      });
    }
    for (const transfer of movementData.transfers || []) {
      for (const item of transfer.items || []) {
        if (warehouseId === 'all' || transfer.fromWarehouseId === warehouseId || transfer.from_warehouse_id === warehouseId) movementRows.push({ [C.date]: dateOnly(transfer.date), [C.type]: L('transferOut'), [C.reference]: transfer.number, [C.warehouse]: transfer.fromWarehouse || '—', [C.product]: item.product || '—', [C.qty]: -Number(item.qty || 0) });
        if (warehouseId === 'all' || transfer.toWarehouseId === warehouseId || transfer.to_warehouse_id === warehouseId) movementRows.push({ [C.date]: dateOnly(transfer.date), [C.type]: L('transferIn'), [C.reference]: transfer.number, [C.warehouse]: transfer.toWarehouse || '—', [C.product]: item.product || '—', [C.qty]: Number(item.qty || 0) });
      }
    }
    for (const count of movementData.inventoryCounts || []) {
      for (const item of count.items || []) movementRows.push({ [C.date]: dateOnly(count.date), [C.type]: B('Stocktake', 'جرد'), [C.reference]: count.number, [C.warehouse]: count.warehouse || '—', [C.product]: item.product || '—', [C.qty]: Number(item.difference || 0) });
    }
    return { columns: [C.date, C.type, C.reference, C.warehouse, C.product, C.qty], rows: movementRows };
  }, [reportType, serverReport, language, warehouseId, data]);

  const reportCards = [
    { type: 'sales', icon: Receipt, title: L('salesReport'), value: formatCurrency(totalSales, language), hint: L('salesReportsHint') },
    { type: 'stock', icon: Boxes, title: L('inventoryReport'), value: lowStockProducts(data).length, hint: L('stockReportsHint') },
    { type: 'profit', icon: BarChart3, title: L('profitReport'), value: formatCurrency(totalProfit, language), hint: L('profitReportsHint') },
    { type: 'purchases', icon: PackagePlus, title: L('purchasesReport'), value: formatCurrency(totalPurchases, language), hint: L('purchasesReportsHint') },
  ];

  return <div className="space-y-6"><PageTitle icon={BarChart3} title={B('Business Reports', 'تقارير الأعمال')} description={B('Every report and its date/warehouse filters are loaded directly from the backend.', 'كل تقرير وفلاتر التاريخ والمخزن يتم تحميلها مباشرة من الخادم.')} />
    <section className="card p-5">
      <div className="mb-4 flex flex-col gap-1"><h3 className="text-lg font-semibold text-primary">{L('mainReports')}</h3><p className="text-sm text-muted">{B('Choose the required report directly from the report cards below.', 'اختار التقرير المطلوب مباشرة من كروت التقارير بالأسفل.')}</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{reportCards.map((card) => { const Icon = card.icon; const active = reportType === card.type; return <button key={card.type} type="button" onClick={() => selectReport(card.type)} aria-pressed={active} className={`group min-h-[11rem] rounded-3xl border p-5 text-start transition ${active ? 'border-cyan-400 bg-cyan-600 text-white shadow-soft' : 'border-soft bg-white/80 hover:border-cyan-300 hover:bg-cyan-50 dark:bg-white/5 dark:hover:bg-cyan-500/10'}`}><div className="flex items-center justify-between gap-3"><span className={`rounded-2xl p-3 ${active ? 'bg-white/15 text-white' : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200'}`}><Icon className="h-5 w-5" /></span><strong className={`text-xl ${active ? 'text-white' : 'text-primary'}`}>{card.value}</strong></div><h4 className={`mt-4 text-base font-semibold ${active ? 'text-white' : 'text-primary'}`}>{card.title}</h4><p className={`mt-1 text-sm ${active ? 'text-white/80' : 'text-muted'}`}>{card.hint}</p></button>; })}</div>
    </section>
    <section className="card p-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><SelectInput label={L('reportType')} value={reportType} onChange={selectReport}><option value="sales">{L('salesReport')}</option><option value="stock">{L('inventoryReport')}</option><option value="profit">{L('profitReport')}</option><option value="purchases">{L('purchasesReport')}</option><option value="customers">{L('customerBalances')}</option><option value="suppliers">{L('supplierBalances')}</option><option value="treasury">{L('treasuryReport')}</option><option value="movement">{L('stockMovement')}</option></SelectInput><TextInput label={L('fromDate')} type="date" value={fromDate} onChange={setFromDate} /><TextInput label={L('toDate')} type="date" value={toDate} onChange={setToDate} /><SelectInput label={L('warehouse')} value={warehouseId} onChange={setWarehouseId}><option value="all">{L('all')}</option>{data.warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</SelectInput><div className="flex items-end gap-3"><button className="btn-secondary w-full gap-2" type="button" disabled={isLoadingReport || Boolean(reportError)} onClick={() => { exportToCsv(`${reportType}-report.csv`, report.rows); toast.success(L('exported')); }}><Download className="h-4 w-4" />{L('export')}</button><button className="btn-secondary w-full gap-2" type="button" disabled={isLoadingReport || Boolean(reportError)} onClick={() => printElementById('reports-table', B(`${reportType} report`, 'تقرير'))}><Printer className="h-4 w-4" />{L('print')}</button></div></div></section>
    <div ref={reportResultsRef}>
    {reportError ? <section className="card border border-rose-200 p-5 text-sm text-rose-700 dark:border-rose-400/30 dark:text-rose-200">{reportError}</section> : null}
    {isLoadingReport ? <section className="card p-8 text-center text-muted">{B('Loading report from backend…', 'جارٍ تحميل التقرير من الخادم…')}</section> : <SimpleTable id="reports-table" empty={L('noData')} columns={report.columns} rows={report.rows} renderRow={(row, index) => <tr key={`${reportType}-${index}`} className="border-b border-soft">{report.columns.map((column) => <td key={column} className="px-5 py-4 text-muted">{row[column]}</td>)}</tr>} />}
    </div>
  </div>;
}
