export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrencyParts(value, language = 'en') {
  const amount = Number(value || 0);

  const formattedNumber = new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return {
    amount: formattedNumber,
    currency: language === 'ar' ? 'ج.م' : 'EGP',
  };
}

export function formatCurrency(value, language = 'en') {
  const parts = formatCurrencyParts(value, language);
  return language === 'ar' ? `${parts.amount} ${parts.currency}` : `${parts.currency} ${parts.amount}`;
}

export function formatDate(value, language = 'en') {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (_error) {
    return String(value);
  }
}

export function stockStatus(quantity) {
  const value = Number(quantity || 0);
  if (value <= 0) return 'out_of_stock';
  if (value < 10) return 'low_stock';
  return 'in_stock';
}

export function stockLabel(quantity, t) {
  return t(`stock.${stockStatus(quantity)}`);
}

export function stockTone(quantity) {
  const status = typeof quantity === 'string' ? quantity : stockStatus(quantity);
  if (status === 'out_of_stock') return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-500/10 dark:border-rose-400/30';
  if (status === 'low_stock') return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-400/30';
  return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-400/30';
}

export function statusTone(status) {
  if (status === 'inactive' || status === 'rejected') return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-500/10 dark:border-rose-400/30';
  if (status === 'pending') return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-400/30';
  return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-400/30';
}

export function priorityTone(priority) {
  if (priority === 'urgent' || priority === 'high') return 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-500/10 dark:border-rose-400/30';
  if (priority === 'medium') return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-400/30';
  return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-400/30';
}

export function normalizeStatus(status) {
  return String(status || '').toLowerCase().replace(/\s+/g, '_');
}

export function exportToCsv(filename, rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) return false;
  const headers = Object.keys(safeRows[0]);
  const csvRows = [headers.join(',')];
  safeRows.forEach((row) => {
    csvRows.push(headers.map((key) => '"' + String(row[key] ?? '').replace(/"/g, '""') + '"').join(','));
  });
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export function printElementById(elementId, title = 'ADWETY') {
  const element = document.getElementById(elementId);
  if (!element) return false;
  const popup = window.open('', '_blank', 'width=1200,height=800');
  if (!popup) return false;
  popup.document.write('<!doctype html><html><head><title>' + title + '</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}table{width:100%;border-collapse:collapse}th,td{border:1px solid #cbd5e1;padding:10px;text-align:start}th{background:#f1f5f9}.no-print{display:none}</style></head><body>' + element.outerHTML + '</body></html>');
  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}
