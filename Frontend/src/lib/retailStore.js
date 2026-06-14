import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteJson, extractArray, extractObject, getJson, postJson, putJson } from './api';
import { useToast } from '../context/ToastContext';

export const emptyRetailData = {
  categories: [],
  warehouses: [],
  products: [],
  customers: [],
  suppliers: [],
  salesInvoices: [],
  purchaseInvoices: [],
  returns: [],
  transfers: [],
  inventoryCounts: [],
  treasury: { openingBalance: 0, movements: [] },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function makeId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function toDateInput(value) {
  if (!value) return todayIso();
  return String(value).slice(0, 10);
}

function isObjectId(value) {
  return /^[a-f0-9]{24}$/i.test(String(value || ''));
}

function sameJson(a, b) {
  return JSON.stringify(a || {}) === JSON.stringify(b || {});
}

function normalizeCanceledStatus(status) {
  if (status === 'cancelled') return 'canceled';
  return status || 'active';
}

function backendStatus(status) {
  if (status === 'canceled') return 'cancelled';
  return status || 'active';
}

function numeric(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function normalizeCategory(row = {}) {
  return {
    id: String(row.id || row._id || ''),
    name: row.name || '',
    description: row.description || '',
    status: row.status || 'active',
  };
}

function normalizeWarehouse(row = {}) {
  return {
    id: String(row.id || row._id || ''),
    name: row.name || '',
    code: row.code || '',
    address: row.address || '',
    manager: row.manager || '',
    phone: row.phone || '',
    status: row.status || 'active',
  };
}

function normalizePerson(row = {}, fallbackType = 'customer') {
  return {
    id: String(row.id || row._id || ''),
    type: row.type || fallbackType,
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    openingBalance: numeric(row.openingBalance ?? row.opening_balance),
    balanceType: row.balanceType || row.balance_type || 'debit',
    status: row.status || 'active',
    notes: row.notes || '',
  };
}

export function normalizeRetailProduct(row = {}) {
  const stock = row.stock && typeof row.stock === 'object' && !Array.isArray(row.stock) ? row.stock : {};
  const units = Array.isArray(row.units) && row.units.length ? row.units : [{ name: row.unit || 'Piece', factor: row.unitFactor || row.unit_factor || 1, salePrice: row.salePrice || row.sale_price || 0 }];
  return {
    id: String(row.id || row._id || ''),
    code: row.code || '',
    barcode: row.barcode || '',
    name: row.name || '',
    categoryId: String(row.categoryId || row.category_id || ''),
    unit: row.unit || units[0]?.name || 'Piece',
    unitFactor: numeric(row.unitFactor ?? row.unit_factor, 1),
    purchasePrice: numeric(row.purchasePrice ?? row.purchase_price),
    salePrice: numeric(row.salePrice ?? row.sale_price),
    minStock: numeric(row.minStock ?? row.min_stock),
    stock: Object.fromEntries(Object.entries(stock).map(([key, value]) => [key, numeric(value)])),
    units: units.map((unit) => ({ name: unit.name || 'Piece', factor: numeric(unit.factor ?? unit.unitFactor, 1), salePrice: numeric(unit.salePrice ?? unit.sale_price) })),
    supplierId: String(row.supplierId || row.supplier_id || ''),
    notes: row.notes || '',
    status: row.status || 'active',
  };
}

function normalizeInvoice(row = {}, forcedKind) {
  const kind = forcedKind || row.kind || row.type || (row.supplierId || row.supplier_id ? 'purchase' : 'sale');
  return {
    id: String(row.id || row._id || ''),
    kind,
    number: row.number || '',
    date: toDateInput(row.date),
    warehouseId: String(row.warehouseId || row.warehouse_id || ''),
    customerId: String(row.customerId || row.customer_id || ''),
    supplierId: String(row.supplierId || row.supplier_id || ''),
    paymentMethod: row.paymentMethod || row.payment_method || 'cash',
    discount: numeric(row.discount),
    paid: numeric(row.paid),
    notes: row.notes || '',
    status: normalizeCanceledStatus(row.status),
    canceledAt: row.cancelledAt || row.canceledAt || '',
    cancellationReason: row.cancellationReason || row.cancellation_reason || '',
    items: (row.items || []).map((item) => ({
      productId: String(item.productId || item.product_id || ''),
      unit: item.unit || 'Piece',
      unitFactor: numeric(item.unitFactor ?? item.unit_factor, 1),
      qty: numeric(item.qty),
      price: numeric(item.price),
      purchasePrice: numeric(item.purchasePrice ?? item.purchase_price),
      discount: numeric(item.discount),
    })),
  };
}

function normalizeReturn(row = {}) {
  const items = (row.items || []).map((item) => ({
    productId: String(item.productId || item.product_id || ''),
    qty: numeric(item.qty),
    price: numeric(item.price),
    discount: numeric(item.discount),
  }));
  const first = items[0] || {};
  return {
    id: String(row.id || row._id || ''),
    kind: row.kind || 'sales',
    number: row.number || '',
    date: toDateInput(row.date),
    invoiceId: String(row.invoiceId || row.invoice_id || ''),
    invoiceNumber: row.invoiceNumber || row.invoice_number || '',
    warehouseId: String(row.warehouseId || row.warehouse_id || ''),
    customerId: String(row.customerId || row.customer_id || ''),
    supplierId: String(row.supplierId || row.supplier_id || ''),
    productId: String(row.productId || row.product_id || first.productId || ''),
    qty: numeric(row.qty ?? first.qty),
    refund: numeric(row.refund ?? row.total),
    reason: row.reason || '',
    status: normalizeCanceledStatus(row.status),
    items,
  };
}

function normalizeTransfer(row = {}) {
  const items = (row.items || []).map((item) => ({ productId: String(item.productId || item.product_id || ''), qty: numeric(item.qty) }));
  const first = items[0] || {};
  return {
    id: String(row.id || row._id || ''),
    number: row.number || '',
    date: toDateInput(row.date),
    fromWarehouseId: String(row.fromWarehouseId || row.from_warehouse_id || ''),
    toWarehouseId: String(row.toWarehouseId || row.to_warehouse_id || ''),
    productId: String(row.productId || row.product_id || first.productId || ''),
    qty: numeric(row.qty ?? first.qty),
    notes: row.notes || '',
    status: normalizeCanceledStatus(row.status || 'completed'),
    items,
  };
}

function normalizeInventoryCount(row = {}) {
  return {
    id: String(row.id || row._id || ''),
    number: row.number || '',
    date: toDateInput(row.date),
    warehouseId: String(row.warehouseId || row.warehouse_id || ''),
    notes: row.notes || '',
    status: normalizeCanceledStatus(row.status || 'applied'),
    items: (row.items || []).map((item) => ({
      productId: String(item.productId || item.product_id || ''),
      current: numeric(item.current ?? item.currentQty ?? item.current_qty),
      counted: numeric(item.counted ?? item.countedQty ?? item.counted_qty),
      difference: numeric(item.difference),
      note: item.note || '',
    })),
  };
}

function normalizeTreasury(row = {}) {
  return {
    id: String(row.id || row._id || ''),
    date: toDateInput(row.date),
    type: row.type || 'income',
    category: row.category || '',
    amount: numeric(row.amount),
    description: row.description || '',
    warehouseId: String(row.warehouseId || row.warehouse_id || ''),
    sourceType: row.sourceType || row.source_type || 'manual',
    sourceId: String(row.sourceId || row.source_id || ''),
  };
}

function dateForApi(value) {
  return value ? String(value).slice(0, 10) : todayIso();
}

function productPayload(row = {}) {
  const units = normalizeProductUnits(row);
  const primary = units[0] || { name: row.unit || 'Piece', factor: 1, salePrice: row.salePrice || 0 };
  return cleanObject({
    code: row.code,
    barcode: row.barcode || '',
    name: row.name,
    categoryId: isObjectId(row.categoryId) ? row.categoryId : null,
    unit: primary.name || row.unit || 'Piece',
    unitFactor: numeric(primary.factor ?? row.unitFactor, 1),
    purchasePrice: numeric(row.purchasePrice),
    salePrice: numeric(row.salePrice ?? primary.salePrice),
    minStock: numeric(row.minStock),
    stock: row.stock || {},
    units,
    supplierId: isObjectId(row.supplierId) ? row.supplierId : null,
    notes: row.notes || '',
    status: row.status || 'active',
  });
}

function categoryPayload(row = {}) {
  return { name: row.name, description: row.description || '', status: row.status || 'active' };
}

function warehousePayload(row = {}) {
  return { name: row.name, code: row.code || row.name || `WH-${Date.now()}`, address: row.address || '', manager: row.manager || '', phone: row.phone || '', status: row.status || 'active' };
}

function personPayload(row = {}) {
  return { name: row.name, phone: row.phone || '', email: row.email || '', address: row.address || '', openingBalance: numeric(row.openingBalance), balanceType: row.balanceType || 'debit', notes: row.notes || '', status: row.status || 'active' };
}

function invoicePayload(row = {}) {
  return cleanObject({
    number: row.number,
    date: dateForApi(row.date),
    warehouseId: row.warehouseId,
    customerId: row.kind === 'sale' ? (row.customerId || null) : null,
    supplierId: row.kind === 'purchase' ? (row.supplierId || null) : null,
    paymentMethod: row.paymentMethod || 'cash',
    discount: numeric(row.discount),
    paid: numeric(row.paid),
    notes: row.notes || '',
    items: (row.items || []).map((item) => ({
      productId: item.productId,
      unit: item.unit || 'Piece',
      unitFactor: numeric(item.unitFactor, 1),
      qty: numeric(item.qty),
      price: numeric(item.price),
      discount: numeric(item.discount),
    })),
  });
}

function returnPayload(row = {}, data = {}) {
  const invoices = row.kind === 'sales' ? data.salesInvoices || [] : data.purchaseInvoices || [];
  const sourceInvoice = invoices.find((invoice) => invoice.id === row.invoiceId) || {};
  const sourceLine = (sourceInvoice.items || []).find((item) => item.productId === row.productId) || {};
  return cleanObject({
    kind: row.kind || 'sales',
    number: row.number,
    date: dateForApi(row.date),
    invoiceId: row.invoiceId || null,
    warehouseId: row.warehouseId || sourceInvoice.warehouseId,
    customerId: row.kind === 'sales' ? (row.customerId || sourceInvoice.customerId || null) : null,
    supplierId: row.kind === 'purchase' ? (row.supplierId || sourceInvoice.supplierId || null) : null,
    reason: row.reason || '',
    refund: numeric(row.refund),
    items: (row.items && row.items.length ? row.items : [{ productId: row.productId, qty: row.qty, price: sourceLine.price || row.refund || 0, discount: 0 }]).map((item) => ({
      productId: item.productId,
      qty: numeric(item.qty),
      price: numeric(item.price),
      discount: numeric(item.discount),
    })),
  });
}

function transferPayload(row = {}) {
  const items = row.items && row.items.length ? row.items : [{ productId: row.productId, qty: row.qty }];
  return cleanObject({
    number: row.number,
    date: dateForApi(row.date),
    fromWarehouseId: row.fromWarehouseId,
    toWarehouseId: row.toWarehouseId,
    notes: row.notes || '',
    status: backendStatus(row.status || 'completed'),
    items: items.map((item) => ({ productId: item.productId, qty: numeric(item.qty) })),
  });
}

function countPayload(row = {}) {
  return cleanObject({
    number: row.number,
    date: dateForApi(row.date),
    warehouseId: row.warehouseId,
    notes: row.notes || '',
    status: backendStatus(row.status || 'applied'),
    items: (row.items || []).map((item) => ({ productId: item.productId, countedQty: numeric(item.counted ?? item.countedQty) })),
  });
}

function treasuryPayload(row = {}) {
  return cleanObject({
    date: dateForApi(row.date),
    type: row.type || 'income',
    category: row.category || 'Manual movement',
    amount: numeric(row.amount),
    description: row.description || '',
    warehouseId: isObjectId(row.warehouseId) ? row.warehouseId : null,
    sourceType: row.sourceType || 'manual',
  });
}

function isManualTreasuryMovement(row = {}) {
  const sourceType = row.sourceType || row.source_type || 'manual';
  return !sourceType || sourceType === 'manual' || sourceType === 'opening';
}

function normalizeRetailDataFromBackend(payloads) {
  const [categories, warehouses, products, customers, suppliers, salesInvoices, purchaseInvoices, returnsRows, transfers, inventoryCounts, treasury] = payloads;
  return {
    categories: extractArray(categories).map(normalizeCategory),
    warehouses: extractArray(warehouses).map(normalizeWarehouse),
    products: extractArray(products).map(normalizeRetailProduct),
    customers: extractArray(customers).map((row) => normalizePerson(row, 'customer')),
    suppliers: extractArray(suppliers).map((row) => normalizePerson(row, 'supplier')),
    salesInvoices: extractArray(salesInvoices).map((row) => normalizeInvoice(row, 'sale')),
    purchaseInvoices: extractArray(purchaseInvoices).map((row) => normalizeInvoice(row, 'purchase')),
    returns: extractArray(returnsRows).map(normalizeReturn),
    transfers: extractArray(transfers).map(normalizeTransfer),
    inventoryCounts: extractArray(inventoryCounts).map(normalizeInventoryCount),
    treasury: {
      openingBalance: 0,
      movements: extractArray(treasury).map(normalizeTreasury).filter(isManualTreasuryMovement),
    },
  };
}


function encodeQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  return search.toString();
}

export async function searchRetailProducts(query, options = {}) {
  const q = String(query || '').trim();
  const params = {
    q,
    status: 'active',
    limit: options.limit || 60,
  };
  if (options.requireStock && options.warehouseId) params.warehouseId = options.warehouseId;
  const payload = await getJson(`/products?${encodeQuery(params)}`);
  return extractArray(payload).map(normalizeRetailProduct);
}

export async function lookupRetailProduct(value, options = {}) {
  const token = String(value || '').trim();
  if (!token) return null;
  const params = { value: token };
  if (options.warehouseId) params.warehouseId = options.warehouseId;
  const payload = await getJson(`/products/lookup?${encodeQuery(params)}`);
  return normalizeRetailProduct(extractObject(payload));
}

export function getRetailData() {
  return clone(emptyRetailData);
}

export async function loadRetailDataFromApi() {
  const endpoints = [
    '/categories?limit=300',
    '/warehouses?limit=300',
    '/products?limit=300',
    '/customers?limit=300',
    '/suppliers?limit=300',
    '/sales-invoices?limit=300',
    '/purchases?limit=300',
    '/returns?limit=300',
    '/transfers?limit=300',
    '/inventory-count?limit=300',
    '/treasury?limit=300',
  ];

  // A failure in a secondary retail endpoint must not erase warehouses/products
  // that were loaded successfully. Keep partial data and expose the failed paths.
  const settled = await Promise.allSettled(endpoints.map((endpoint) => getJson(endpoint)));
  const failures = settled
    .map((result, index) => result.status === 'rejected' ? { endpoint: endpoints[index], error: result.reason } : null)
    .filter(Boolean);

  if (failures.length === settled.length) throw failures[0].error;

  const payloads = settled.map((result) => result.status === 'fulfilled' ? result.value : { data: [] });
  const data = normalizeRetailDataFromBackend(payloads);
  data.loadWarnings = failures.map(({ endpoint, error }) => ({ endpoint, message: error?.message || 'Request failed' }));
  return data;
}

function collectionChanged(previous = [], next = []) {
  return !sameJson(previous, next);
}

async function syncSimpleCollection(previousData, nextData, collection, endpoint, toPayload) {
  const previous = previousData[collection] || [];
  const next = nextData[collection] || [];
  const previousById = new Map(previous.map((row) => [String(row.id), row]));
  const nextById = new Map(next.map((row) => [String(row.id), row]));

  for (const row of next) {
    const oldRow = previousById.get(String(row.id));
    if (!oldRow) {
      await postJson(endpoint, toPayload(row));
    } else if (!sameJson(oldRow, row) && isObjectId(row.id)) {
      await putJson(`${endpoint}/${row.id}`, toPayload(row));
    }
  }

  for (const row of previous) {
    if (!nextById.has(String(row.id)) && isObjectId(row.id)) {
      await deleteJson(`${endpoint}/${row.id}`);
    }
  }
}

function hasComplexStockMutation(previousData, nextData) {
  return ['salesInvoices', 'purchaseInvoices', 'returns', 'transfers', 'inventoryCounts'].some((key) => collectionChanged(previousData[key], nextData[key]));
}

async function syncInvoices(previousData, nextData, collection, endpoint, kind) {
  const previous = previousData[collection] || [];
  const next = nextData[collection] || [];
  const previousById = new Map(previous.map((row) => [String(row.id), row]));
  const nextById = new Map(next.map((row) => [String(row.id), row]));

  for (const row of next) {
    const oldRow = previousById.get(String(row.id));
    const normalized = { ...row, kind };
    if (!oldRow) {
      await postJson(endpoint, invoicePayload(normalized));
    } else if (!sameJson(oldRow, row) && isObjectId(row.id)) {
      if (oldRow.status !== 'canceled' && row.status === 'canceled') {
        await postJson(`${endpoint}/${row.id}/cancel`, { reason: row.cancellationReason || 'Canceled from dashboard' });
      } else {
        await putJson(`${endpoint}/${row.id}`, invoicePayload(normalized));
      }
    }
  }

  for (const row of previous) {
    if (!nextById.has(String(row.id)) && isObjectId(row.id)) {
      await deleteJson(`${endpoint}/${row.id}`);
    }
  }
}

async function syncReturns(previousData, nextData) {
  const previous = previousData.returns || [];
  const next = nextData.returns || [];
  const previousById = new Map(previous.map((row) => [String(row.id), row]));
  const nextById = new Map(next.map((row) => [String(row.id), row]));
  for (const row of next) {
    const oldRow = previousById.get(String(row.id));
    if (!oldRow) await postJson('/returns', returnPayload(row, nextData));
    else if (!sameJson(oldRow, row) && isObjectId(row.id)) await putJson(`/returns/${row.id}`, returnPayload(row, nextData));
  }
  for (const row of previous) if (!nextById.has(String(row.id)) && isObjectId(row.id)) await deleteJson(`/returns/${row.id}`);
}

async function syncTransfers(previousData, nextData) {
  const previous = previousData.transfers || [];
  const next = nextData.transfers || [];
  const previousById = new Map(previous.map((row) => [String(row.id), row]));
  const nextById = new Map(next.map((row) => [String(row.id), row]));
  for (const row of next) {
    const oldRow = previousById.get(String(row.id));
    if (!oldRow) await postJson('/transfers', transferPayload(row));
    else if (!sameJson(oldRow, row) && isObjectId(row.id)) await putJson(`/transfers/${row.id}`, transferPayload(row));
  }
  for (const row of previous) if (!nextById.has(String(row.id)) && isObjectId(row.id)) await deleteJson(`/transfers/${row.id}`);
}

async function syncInventoryCounts(previousData, nextData) {
  const previous = previousData.inventoryCounts || [];
  const next = nextData.inventoryCounts || [];
  const previousById = new Map(previous.map((row) => [String(row.id), row]));
  const nextById = new Map(next.map((row) => [String(row.id), row]));
  for (const row of next) {
    const oldRow = previousById.get(String(row.id));
    if (!oldRow) await postJson('/inventory-count', countPayload(row));
    else if (!sameJson(oldRow, row) && isObjectId(row.id)) await putJson(`/inventory-counts/${row.id}`, countPayload(row));
  }
  for (const row of previous) if (!nextById.has(String(row.id)) && isObjectId(row.id)) await deleteJson(`/inventory-counts/${row.id}`);
}

async function syncTreasury(previousData, nextData) {
  const previous = previousData.treasury?.movements || [];
  const next = nextData.treasury?.movements || [];
  const previousById = new Map(previous.map((row) => [String(row.id), row]));
  const nextById = new Map(next.map((row) => [String(row.id), row]));
  for (const row of next) {
    const oldRow = previousById.get(String(row.id));
    if (!oldRow) await postJson('/treasury', treasuryPayload(row));
    else if (!sameJson(oldRow, row) && isObjectId(row.id)) await putJson(`/treasury/${row.id}`, treasuryPayload(row));
  }
  for (const row of previous) if (!nextById.has(String(row.id)) && isObjectId(row.id)) await deleteJson(`/treasury/${row.id}`);
}

export async function syncRetailDiff(previousData, nextData) {
  const complexStockMutation = hasComplexStockMutation(previousData, nextData);
  await syncSimpleCollection(previousData, nextData, 'categories', '/categories', categoryPayload);
  await syncSimpleCollection(previousData, nextData, 'warehouses', '/warehouses', warehousePayload);
  await syncSimpleCollection(previousData, nextData, 'customers', '/customers', personPayload);
  await syncSimpleCollection(previousData, nextData, 'suppliers', '/suppliers', personPayload);
  if (!complexStockMutation) await syncSimpleCollection(previousData, nextData, 'products', '/products', productPayload);
  await syncInvoices(previousData, nextData, 'salesInvoices', '/sales-invoices', 'sale');
  await syncInvoices(previousData, nextData, 'purchaseInvoices', '/purchases', 'purchase');
  await syncReturns(previousData, nextData);
  await syncTransfers(previousData, nextData);
  await syncInventoryCounts(previousData, nextData);
  await syncTreasury(previousData, nextData);
}

export function useRetailStore() {
  const toast = useToast();
  const [data, setData] = useState(() => getRetailData());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    loadRetailDataFromApi()
      .then((fresh) => {
        if (!cancelled) {
          dataRef.current = fresh;
          setData(fresh);
          setError(fresh.loadWarnings?.length ? new Error(`Some retail endpoints failed: ${fresh.loadWarnings.map((item) => item.endpoint).join(', ')}`) : null);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError);
          dataRef.current = clone(emptyRetailData);
          setData(clone(emptyRetailData));
          toast.error(loadError?.message || 'Could not load retail data from the backend.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const updateData = useCallback(async (updater) => {
    setIsSaving(true);
    try {
      const previous = clone(dataRef.current);
      const next = typeof updater === 'function' ? updater(clone(previous)) : clone(updater);
      await syncRetailDiff(previous, next);
      const fresh = await loadRetailDataFromApi();
      dataRef.current = fresh;
      setData(fresh);
      setError(fresh.loadWarnings?.length ? new Error(`Some retail endpoints failed: ${fresh.loadWarnings.map((item) => item.endpoint).join(', ')}`) : null);
      return fresh;
    } catch (syncError) {
      setError(syncError);
      throw syncError;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const reset = useCallback(async () => {
    const fresh = await loadRetailDataFromApi();
    dataRef.current = fresh;
    setData(fresh);
    setError(fresh.loadWarnings?.length ? new Error(`Some retail endpoints failed: ${fresh.loadWarnings.map((item) => item.endpoint).join(', ')}`) : null);
    return fresh;
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const fresh = await loadRetailDataFromApi();
      dataRef.current = fresh;
      setData(fresh);
      setError(fresh.loadWarnings?.length ? new Error(`Some retail endpoints failed: ${fresh.loadWarnings.map((item) => item.endpoint).join(', ')}`) : null);
      return fresh;
    } catch (refreshError) {
      setError(refreshError);
      throw refreshError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return useMemo(() => ({ data, setData: updateData, reset, refresh, isLoading, isSaving, error, isBackendConnected: !error }), [data, updateData, reset, refresh, isLoading, isSaving, error]);
}

export function invoiceSubtotal(items = []) {
  return items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);
}

export function invoiceLineTotal(item = {}) {
  return Math.max(0, Number(item.qty || 0) * Number(item.price || 0) - Number(item.discount || 0));
}

export function invoiceTotal(invoice = {}) {
  const subtotal = (invoice.items || []).reduce((sum, item) => sum + invoiceLineTotal(item), 0);
  return Math.max(0, subtotal - Number(invoice.discount || 0));
}

export function invoiceDue(invoice = {}) {
  return Math.max(0, invoiceTotal(invoice) - Number(invoice.paid || 0));
}

export function getProductStock(product, warehouseId = '') {
  if (!product) return 0;
  if (warehouseId) return Number(product.stock?.[warehouseId] || 0);
  return Object.values(product.stock || {}).reduce((sum, value) => sum + Number(value || 0), 0);
}

export function getProductName(data, productId) {
  return data.products.find((item) => item.id === productId)?.name || 'Unknown product';
}

export function getWarehouseName(data, warehouseId) {
  return data.warehouses.find((item) => item.id === warehouseId)?.name || '—';
}

export function getCustomerName(data, customerId) {
  return data.customers.find((item) => item.id === customerId)?.name || '—';
}

export function getSupplierName(data, supplierId) {
  return data.suppliers.find((item) => item.id === supplierId)?.name || '—';
}

export function getCategoryName(data, categoryId) {
  return data.categories.find((item) => item.id === categoryId)?.name || '—';
}

export function addStock(data, productId, warehouseId, quantity) {
  const product = data.products.find((item) => item.id === productId);
  if (!product || !warehouseId) return;
  product.stock = product.stock || {};
  product.stock[warehouseId] = Number(product.stock[warehouseId] || 0) + Number(quantity || 0);
}

export function removeStock(data, productId, warehouseId, quantity) {
  const product = data.products.find((item) => item.id === productId);
  if (!product || !warehouseId) return;
  product.stock = product.stock || {};
  product.stock[warehouseId] = Math.max(0, Number(product.stock[warehouseId] || 0) - Number(quantity || 0));
}

export function nextDocNumber(prefix, rows = []) {
  const next = rows.length + 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

export function treasuryBalance(data) {
  const opening = Number(data.treasury?.openingBalance || 0);
  const movementBalance = (data.treasury?.movements || []).reduce((sum, item) => sum + (item.type === 'income' ? Number(item.amount || 0) : -Number(item.amount || 0)), 0);
  const salesPaid = (data.salesInvoices || []).reduce((sum, invoice) => sum + Number(invoice.paid || 0), 0);
  const purchasePaid = (data.purchaseInvoices || []).reduce((sum, invoice) => sum + Number(invoice.paid || 0), 0);
  const returnsImpact = (data.returns || []).reduce((sum, item) => sum + (item.kind === 'sales' ? -Number(item.refund || 0) : Number(item.refund || 0)), 0);
  return opening + movementBalance + salesPaid - purchasePaid + returnsImpact;
}

export function profitForInvoice(data, invoice = {}) {
  return (invoice.items || []).reduce((sum, item) => {
    const product = data.products.find((row) => row.id === item.productId);
    const cost = Number(product?.purchasePrice || 0) * Number(item.qty || 0);
    return sum + invoiceLineTotal(item) - cost;
  }, 0) - Number(invoice.discount || 0);
}


export function normalizeProductUnits(product = {}) {
  const baseUnit = product.unit || 'Piece';
  const baseSalePrice = Number(product.salePrice || 0);
  if (Array.isArray(product.units) && product.units.length) {
    return product.units.map((unit) => ({
      name: unit.name || baseUnit,
      factor: Number(unit.factor || unit.unitFactor || 1),
      salePrice: Number(unit.salePrice ?? baseSalePrice),
    }));
  }
  return [{ name: baseUnit, factor: Number(product.unitFactor || 1), salePrice: baseSalePrice }];
}

export function primaryProductUnit(product = {}) {
  return normalizeProductUnits(product)[0];
}

export function lowStockProducts(data) {
  return (data.products || []).filter((product) => getProductStock(product) <= Number(product.minStock || 0));
}
