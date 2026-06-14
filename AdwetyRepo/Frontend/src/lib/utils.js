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

export function safeCsvCell(value) {
  if (value === null || value === undefined) return '';
  let text = String(value);
  // Excel and Google Sheets may execute cells beginning with formula markers.
  // Prefix user-controlled strings with an apostrophe so they remain plain text.
  if (typeof value === 'string' && /^(?:[\t\r\n]|\s*[=+\-@])/.test(text)) text = `'${text}`;
  return text.replace(/"/g, '""');
}

export function exportToCsv(filename, rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  if (!safeRows.length) return false;
  const headers = Object.keys(safeRows[0]);
  const csvRows = [headers.map((header) => `"${safeCsvCell(header)}"`).join(',')];
  safeRows.forEach((row) => {
    csvRows.push(headers.map((key) => `"${safeCsvCell(row[key])}"`).join(','));
  });
  const blob = new Blob([`\uFEFF${csvRows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
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

export function printElementById(elementId, title = 'BAHAMAS MATGR') {
  const element = document.getElementById(elementId);
  if (!element) return false;
  const popup = window.open('', '_blank', 'width=1200,height=900');
  if (!popup) return false;

  const direction = element.getAttribute('dir') || document.documentElement.getAttribute('dir') || 'ltr';
  const printCss = `
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f8fafc;
      color: #0f172a;
      font-family: Arial, Tahoma, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      direction: ${direction};
    }
    body > * { max-width: 210mm; margin: 0 auto; }
    .no-print, button, nav, aside { display: none !important; }
    .invoice-print {
      width: 100%;
      max-width: 190mm;
      min-height: 265mm;
      margin: 0 auto;
      padding: 12mm;
      background: #ffffff;
      border: 1px solid #dbe4ef;
      border-radius: 14px;
      box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 18px;
      padding-bottom: 16px;
      border-bottom: 3px solid #0f766e;
    }
    .invoice-brand { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.24em; color: #0f766e; text-transform: uppercase; }
    .invoice-header h1 { margin: 8px 0 4px; font-size: 28px; line-height: 1.15; color: #0f172a; }
    .invoice-subtitle { margin: 0; font-size: 13px; color: #64748b; }
    .invoice-reference-box {
      min-width: 130px;
      padding: 12px;
      text-align: center;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      background: #f8fafc;
    }
    .invoice-reference-box span { display: block; font-size: 10px; letter-spacing: 0.16em; color: #64748b; text-transform: uppercase; }
    .invoice-reference-box strong { display: block; margin-top: 6px; font-size: 14px; color: #0f172a; }
    .invoice-reference-box small { display: block; margin-top: 4px; font-size: 10px; color: #94a3b8; word-break: break-all; }
    .invoice-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 14px;
      margin-top: 16px;
      padding: 14px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #f8fafc;
      font-size: 13px;
    }
    .invoice-meta-grid div { display: grid; gap: 4px; }
    .invoice-meta-grid span { color: #64748b; font-size: 11px; }
    .invoice-meta-grid strong { color: #0f172a; font-size: 13px; }
    table, .invoice-items-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 9px 10px; text-align: start; vertical-align: top; }
    th { background: #0f766e; color: #ffffff; font-weight: 700; }
    tbody tr:nth-child(even) td { background: #f8fafc; }
    .invoice-summary-section { display: grid; grid-template-columns: 1fr 74mm; gap: 16px; margin-top: 18px; align-items: start; }
    .invoice-notes-box, .invoice-totals-box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; background: #ffffff; }
    .invoice-notes-box span { display: block; margin-bottom: 8px; font-size: 11px; font-weight: 700; color: #64748b; }
    .invoice-notes-box p { margin: 0; min-height: 52px; color: #334155; font-size: 12px; }
    .invoice-totals-box div { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .invoice-totals-box div:last-child { border-bottom: 0; }
    .invoice-grand-total { margin: 4px -4px; padding: 10px 4px !important; background: #ecfdf5; border-top: 2px solid #0f766e; border-bottom: 2px solid #0f766e !important; font-size: 16px !important; color: #064e3b; }
    .invoice-footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #cbd5e1; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px; color: #475569; }
    .invoice-footer div span { display: block; height: 36px; margin-top: 10px; border-bottom: 1px dashed #94a3b8; }
    .invoice-footer p { grid-column: 1 / -1; margin: 10px 0 0; text-align: center; color: #64748b; }
    @media print {
      body { background: #ffffff; }
      body > * { max-width: none; }
      .invoice-print { min-height: auto; border: none; border-radius: 0; box-shadow: none; padding: 0; }
    }
  `;

  popup.document.write(`<!doctype html><html dir="${direction}"><head><meta charset="utf-8"><title>${title}</title><style>${printCss}</style></head><body>${element.outerHTML}</body></html>`);
  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}
