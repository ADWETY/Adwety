import fs from 'node:fs';

const store = fs.readFileSync(new URL('../src/lib/retailStore.js', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const pages = fs.readFileSync(new URL('../src/pages/retail/RetailPages.jsx', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../src/lib/api.js', import.meta.url), 'utf8');

const checks = [
  ['new invoices do not send browser-generated numbers', store.includes('number: isObjectId(row.id) ? row.number : undefined')],
  ['retail data is shared by a persistent provider', app.includes('<RetailStoreProvider>') && app.includes('<Outlet />')],
  ['strict-mode duplicate loads are coalesced', store.includes('if (retailLoadPromises.has(key)) return clone(await retailLoadPromises.get(key))')],
  ['double save is blocked synchronously', store.includes('if (savingRef.current) return dataRef.current')],
  ['GET requests are coalesced globally', api.includes('const inFlightGetRequests = new Map()')],
  ['rate limit errors are localized', api.includes('تم إرسال طلبات كثيرة في وقت قصير')],
  ['POS discovers the server-assigned invoice number', pages.includes('!previousInvoiceIds.has(invoice.id)')],
];

let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
