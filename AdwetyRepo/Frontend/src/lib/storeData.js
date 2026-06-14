import { useCallback, useEffect, useMemo, useState } from 'react';

export const STORE_KEY = 'adwety_store_dashboard_state_v2';

export const seedStoreState = {
  categories: [
    { id: 'cat-1', name: 'Pain Relief', description: 'Analgesics and anti-inflammatory products', active: true },
    { id: 'cat-2', name: 'Antibiotics', description: 'Prescription antibiotics', active: true },
    { id: 'cat-3', name: 'Diabetes', description: 'Diabetes care and monitoring', active: true },
    { id: 'cat-4', name: 'Respiratory', description: 'Inhalers and respiratory support', active: true },
  ],
  products: [
    { id: 'prd-1', name: 'Panadol Extra', barcode: '6223001120011', category: 'Pain Relief', warehouse: 'Main Warehouse', purchasePrice: 32, salePrice: 46.5, stock: 22, minStock: 10, supplierId: 'sup-1', lastUpdated: '2026-05-18T09:15:00.000Z' },
    { id: 'prd-2', name: 'Amoxicillin 500mg', barcode: '6223001120028', category: 'Antibiotics', warehouse: 'Main Warehouse', purchasePrice: 62, salePrice: 89, stock: 6, minStock: 12, supplierId: 'sup-2', lastUpdated: '2026-05-19T11:30:00.000Z' },
    { id: 'prd-3', name: 'Glucophage 1000mg', barcode: '6223001120035', category: 'Diabetes', warehouse: 'Branch Stock', purchasePrice: 51, salePrice: 72, stock: 0, minStock: 8, supplierId: 'sup-2', lastUpdated: '2026-05-20T15:00:00.000Z' },
    { id: 'prd-4', name: 'Ventolin Inhaler', barcode: '6223001120042', category: 'Respiratory', warehouse: 'Branch Stock', purchasePrice: 85, salePrice: 118, stock: 14, minStock: 6, supplierId: 'sup-3', lastUpdated: '2026-05-21T17:10:00.000Z' },
    { id: 'prd-5', name: 'Concor 5mg', barcode: '6223001120059', category: 'Blood Pressure', warehouse: 'Main Warehouse', purchasePrice: 45, salePrice: 64, stock: 8, minStock: 10, supplierId: 'sup-1', lastUpdated: '2026-05-22T10:45:00.000Z' },
  ],
  warehouses: [
    { id: 'wh-1', name: 'Main Warehouse', manager: 'Store Manager', location: 'Cairo', active: true },
    { id: 'wh-2', name: 'Branch Stock', manager: 'Branch Admin', location: 'Giza', active: true },
  ],
  customers: [
    { id: 'cus-1', name: 'Walk-in Customer', phone: '+20 100 000 0000', email: 'walkin@example.com', address: 'Cash sales', balance: 0, notes: 'Default cash customer' },
    { id: 'cus-2', name: 'Ahmed Ali', phone: '+20 101 222 3333', email: 'ahmed@example.com', address: 'Nasr City, Cairo', balance: 120, notes: 'Regular customer' },
    { id: 'cus-3', name: 'Sara Hassan', phone: '+20 102 444 5555', email: 'sara@example.com', address: 'Dokki, Giza', balance: 0, notes: 'Prefers delivery' },
  ],
  suppliers: [
    { id: 'sup-1', name: 'Nile Pharma Supply', phone: '+20 111 555 2222', email: 'sales@nilepharma.test', address: 'Cairo', balance: 2500, notes: 'Weekly delivery' },
    { id: 'sup-2', name: 'Delta Medical Trading', phone: '+20 122 888 4444', email: 'delta@medical.test', address: 'Mansoura', balance: 1800, notes: 'Credit limit available' },
    { id: 'sup-3', name: 'Care Distribution', phone: '+20 128 333 7777', email: 'care@dist.test', address: 'Alexandria', balance: 0, notes: 'Fast respiratory stock' },
  ],
  invoices: [
    {
      id: 'INV-1001', number: 'INV-1001', type: 'sale', customerId: 'cus-2', customerName: 'Ahmed Ali', date: '2026-05-22T12:30:00.000Z', status: 'paid', discount: 10, paid: 125,
      items: [
        { productId: 'prd-1', name: 'Panadol Extra', barcode: '6223001120011', qty: 2, price: 46.5, cost: 32 },
        { productId: 'prd-5', name: 'Concor 5mg', barcode: '6223001120059', qty: 1, price: 64, cost: 45 },
      ],
    },
    {
      id: 'INV-1002', number: 'INV-1002', type: 'sale', customerId: 'cus-3', customerName: 'Sara Hassan', date: '2026-05-23T09:15:00.000Z', status: 'partial', discount: 0, paid: 90,
      items: [
        { productId: 'prd-4', name: 'Ventolin Inhaler', barcode: '6223001120042', qty: 1, price: 118, cost: 85 },
      ],
    },
  ],
  returns: [
    { id: 'RET-501', invoiceNumber: 'INV-1001', productName: 'Panadol Extra', qty: 1, amount: 46.5, reason: 'Customer returned sealed item', date: '2026-05-23T13:00:00.000Z' },
  ],
  treasury: [
    { id: 'trx-1', type: 'income', title: 'Cash sales', amount: 250.5, date: '2026-05-22T13:00:00.000Z', note: 'Daily sales cash' },
    { id: 'trx-2', type: 'expense', title: 'Supplier payment', amount: 450, date: '2026-05-22T17:30:00.000Z', note: 'Partial supplier settlement' },
    { id: 'trx-3', type: 'income', title: 'Invoice collection', amount: 90, date: '2026-05-23T10:20:00.000Z', note: 'Partial collection' },
  ],
  transfers: [
    { id: 'TR-301', productName: 'Ventolin Inhaler', barcode: '6223001120042', from: 'Main Warehouse', to: 'Branch Stock', qty: 6, status: 'completed', date: '2026-05-21T11:00:00.000Z' },
    { id: 'TR-302', productName: 'Amoxicillin 500mg', barcode: '6223001120028', from: 'Main Warehouse', to: 'Branch Stock', qty: 10, status: 'pending', date: '2026-05-23T08:00:00.000Z' },
  ],
};

function cloneSeed() {
  return JSON.parse(JSON.stringify(seedStoreState));
}

function normalizeState(value) {
  const seed = cloneSeed();
  if (!value || typeof value !== 'object') return seed;
  return {
    categories: Array.isArray(value.categories) ? value.categories : seed.categories,
    products: Array.isArray(value.products) ? value.products : seed.products,
    warehouses: Array.isArray(value.warehouses) ? value.warehouses : seed.warehouses,
    customers: Array.isArray(value.customers) ? value.customers : seed.customers,
    suppliers: Array.isArray(value.suppliers) ? value.suppliers : seed.suppliers,
    invoices: Array.isArray(value.invoices) ? value.invoices : seed.invoices,
    returns: Array.isArray(value.returns) ? value.returns : seed.returns,
    treasury: Array.isArray(value.treasury) ? value.treasury : seed.treasury,
    transfers: Array.isArray(value.transfers) ? value.transfers : seed.transfers,
  };
}

export function readStoreState() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return cloneSeed();
    return normalizeState(JSON.parse(raw));
  } catch (_error) {
    return cloneSeed();
  }
}

export function persistStoreState(nextState) {
  const normalized = normalizeState(nextState);
  window.localStorage.setItem(STORE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('store-dashboard-updated', { detail: normalized }));
  return normalized;
}

export function resetStoreState() {
  return persistStoreState(cloneSeed());
}

export function useStoreState() {
  const [state, setState] = useState(() => readStoreState());

  useEffect(() => {
    function sync(event) {
      setState(normalizeState(event.detail || readStoreState()));
    }
    window.addEventListener('store-dashboard-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('store-dashboard-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const updateState = useCallback((updater) => {
    setState((current) => {
      const next = typeof updater === 'function' ? updater(normalizeState(current)) : updater;
      return persistStoreState(next);
    });
  }, []);

  return [state, updateState];
}

export function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
}

export function invoiceTotal(invoice) {
  const subtotal = (invoice?.items || []).reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
  return Math.max(0, subtotal - Number(invoice?.discount || 0));
}

export function invoiceCost(invoice) {
  return (invoice?.items || []).reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.cost || 0), 0);
}

export function invoiceProfit(invoice) {
  return invoiceTotal(invoice) - invoiceCost(invoice);
}

export function productStatus(product) {
  const stock = Number(product?.stock || 0);
  const min = Number(product?.minStock || 0);
  if (stock <= 0) return 'out_of_stock';
  if (stock <= min) return 'low_stock';
  return 'in_stock';
}

export function getEntityName(collection, id, fallback = '—') {
  return collection.find((item) => item.id === id)?.name || fallback;
}

export function useStoreMetrics(store) {
  return useMemo(() => {
    const products = store.products || [];
    const invoices = store.invoices || [];
    const returns = store.returns || [];
    const treasury = store.treasury || [];
    const totalStock = products.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const stockValue = products.reduce((sum, item) => sum + Number(item.stock || 0) * Number(item.purchasePrice || 0), 0);
    const lowStock = products.filter((item) => productStatus(item) === 'low_stock').length;
    const outOfStock = products.filter((item) => productStatus(item) === 'out_of_stock').length;
    const sales = invoices.reduce((sum, invoice) => sum + invoiceTotal(invoice), 0);
    const profits = invoices.reduce((sum, invoice) => sum + invoiceProfit(invoice), 0);
    const returnsAmount = returns.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const income = treasury.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expenses = treasury.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const balance = income - expenses;
    return {
      totalStock,
      stockValue,
      lowStock,
      outOfStock,
      sales,
      profits,
      returnsAmount,
      invoiceCount: invoices.length,
      customers: store.customers.length,
      suppliers: store.suppliers.length,
      treasuryBalance: balance,
      income,
      expenses,
    };
  }, [store]);
}

export function filterByDate(rows, fromDate, toDate, field = 'date') {
  const start = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
  const end = toDate ? new Date(`${toDate}T23:59:59`) : null;
  return (rows || []).filter((row) => {
    const value = new Date(row[field] || row.date || row.created_at || Date.now());
    if (start && value < start) return false;
    if (end && value > end) return false;
    return true;
  });
}
