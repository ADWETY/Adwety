const mongoose = require('mongoose');
const { z } = require('zod');
const {
  StoreCategory,
  StoreWarehouse,
  StoreProduct,
  StorePerson,
  StoreInvoice,
  StoreReturn,
  StoreTransfer,
  StoreInventoryCount,
  StoreTreasuryMovement
} = require('../models');
const asyncHandler = require('../utils/async-handler');
const { success } = require('../utils/response');
const { AppError, isValidObjectId, pagination, escapeRegex } = require('../utils/helpers');
const { systemLog } = require('../services/logging.service');

const objectId = z.string().refine(isValidObjectId, 'Invalid ObjectId format');
const optionalObjectId = objectId.optional().nullable();
const status = z.enum(['active', 'inactive']).optional();
const listQuery = (extra = {}) => z.object({
  q: z.string().max(160).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(300).optional().default(50),
  from: z.string().max(40).optional(),
  to: z.string().max(40).optional(),
  dateFrom: z.string().max(40).optional(),
  dateTo: z.string().max(40).optional(),
  ...extra
}).passthrough();
const paramsId = z.object({ id: objectId });
const emptyBody = z.object({}).strict();

exports.listSchema = z.object({ body: emptyBody, query: listQuery(), params: z.object({}).strict() });
exports.byIdSchema = z.object({ body: emptyBody, query: z.object({}).passthrough(), params: paramsId });

const categoryBody = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional().default(''),
  status
}).strict();
exports.createCategorySchema = z.object({ body: categoryBody, query: z.object({}).strict(), params: z.object({}).strict() });
exports.updateCategorySchema = z.object({ body: categoryBody.partial(), query: z.object({}).strict(), params: paramsId });

const warehouseBody = z.object({
  name: z.string().min(1).max(160),
  code: z.string().min(1).max(40),
  address: z.string().max(500).optional().default(''),
  manager: z.string().max(120).optional().default(''),
  phone: z.string().max(40).optional().default(''),
  status
}).strict();
exports.createWarehouseSchema = z.object({ body: warehouseBody, query: z.object({}).strict(), params: z.object({}).strict() });
exports.updateWarehouseSchema = z.object({ body: warehouseBody.partial(), query: z.object({}).strict(), params: paramsId });

const unitBody = z.object({ name: z.string().min(1).max(80), factor: z.coerce.number().min(0.0001).default(1), salePrice: z.coerce.number().min(0).default(0) }).strict();
const stockBody = z.record(z.coerce.number().min(0)).optional().default({});
const productBody = z.object({
  code: z.string().min(1).max(80),
  barcode: z.string().max(120).optional().default(''),
  name: z.string().min(1).max(220),
  categoryId: optionalObjectId,
  category_id: optionalObjectId,
  unit: z.string().max(80).optional().default('Piece'),
  unitFactor: z.coerce.number().min(0.0001).optional().default(1),
  unit_factor: z.coerce.number().min(0.0001).optional(),
  purchasePrice: z.coerce.number().min(0).optional().default(0),
  purchase_price: z.coerce.number().min(0).optional(),
  salePrice: z.coerce.number().min(0).optional().default(0),
  sale_price: z.coerce.number().min(0).optional(),
  minStock: z.coerce.number().min(0).optional().default(0),
  min_stock: z.coerce.number().min(0).optional(),
  stock: stockBody,
  units: z.array(unitBody).optional().default([]),
  supplierId: optionalObjectId,
  supplier_id: optionalObjectId,
  notes: z.string().max(1000).optional().default(''),
  status
}).strict();
exports.createProductSchema = z.object({ body: productBody, query: z.object({}).strict(), params: z.object({}).strict() });
exports.updateProductSchema = z.object({ body: productBody.partial(), query: z.object({}).strict(), params: paramsId });
exports.importProductsSchema = z.object({
  body: z.object({
    products: z.array(productBody.partial().extend({ code: z.string().min(1).max(80), name: z.string().min(1).max(220) })).optional(),
    csv: z.string().max(1000 * 1000).optional()
  }).refine((v) => (v.products && v.products.length) || v.csv, 'products array or csv text is required'),
  query: z.object({}).strict(), params: z.object({}).strict()
});
exports.priceLabelsSchema = z.object({ body: z.object({ productIds: z.array(objectId).optional().default([]) }).strict(), query: z.object({}).passthrough(), params: z.object({}).strict() });
exports.productListSchema = z.object({ body: emptyBody, query: listQuery({ categoryId: optionalObjectId, category_id: optionalObjectId, warehouseId: optionalObjectId, warehouse_id: optionalObjectId, status: z.enum(['active', 'inactive']).optional(), lowStock: z.coerce.boolean().optional(), low_stock: z.coerce.boolean().optional() }), params: z.object({}).strict() });
exports.productLookupSchema = z.object({
  body: emptyBody,
  query: z.object({
    value: z.string().trim().min(1).max(160).optional(),
    barcode: z.string().trim().min(1).max(160).optional(),
    code: z.string().trim().min(1).max(160).optional(),
    q: z.string().trim().min(1).max(160).optional(),
    warehouseId: optionalObjectId,
    warehouse_id: optionalObjectId
  }).passthrough().refine((query) => Boolean(query.value || query.barcode || query.code || query.q), 'value, barcode, code or q is required'),
  params: z.object({}).strict()
});

const personBody = z.object({
  name: z.string().min(1).max(180),
  phone: z.string().max(40).optional().default(''),
  email: z.string().email().optional().or(z.literal('')).default(''),
  address: z.string().max(600).optional().default(''),
  openingBalance: z.coerce.number().min(0).optional().default(0),
  opening_balance: z.coerce.number().min(0).optional(),
  balanceType: z.enum(['debit', 'credit']).optional().default('debit'),
  balance_type: z.enum(['debit', 'credit']).optional(),
  notes: z.string().max(1000).optional().default(''),
  status
}).strict();
exports.createPersonSchema = z.object({ body: personBody, query: z.object({}).strict(), params: z.object({}).strict() });
exports.updatePersonSchema = z.object({ body: personBody.partial(), query: z.object({}).strict(), params: paramsId });
exports.personListSchema = z.object({ body: emptyBody, query: listQuery({ status: z.enum(['active', 'inactive']).optional() }), params: z.object({}).strict() });

const invoiceItemBody = z.object({
  productId: objectId,
  product_id: objectId.optional(),
  unit: z.string().max(80).optional().default('Piece'),
  unitFactor: z.coerce.number().min(0.0001).optional().default(1),
  unit_factor: z.coerce.number().min(0.0001).optional(),
  qty: z.coerce.number().min(0.0001),
  price: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).optional().default(0)
}).passthrough();
const invoiceBody = z.object({
  number: z.string().max(80).optional(),
  date: z.string().max(40).optional(),
  warehouseId: objectId,
  warehouse_id: objectId.optional(),
  customerId: optionalObjectId,
  customer_id: optionalObjectId,
  supplierId: optionalObjectId,
  supplier_id: optionalObjectId,
  paymentMethod: z.enum(['cash', 'card', 'bank', 'wallet', 'credit', 'mixed']).optional().default('cash'),
  payment_method: z.enum(['cash', 'card', 'bank', 'wallet', 'credit', 'mixed']).optional(),
  discount: z.coerce.number().min(0).optional().default(0),
  paid: z.coerce.number().min(0).optional().default(0),
  notes: z.string().max(2000).optional().default(''),
  items: z.array(invoiceItemBody).min(1).max(500)
}).strict();
exports.createInvoiceSchema = z.object({ body: invoiceBody, query: z.object({}).strict(), params: z.object({}).strict() });
exports.updateInvoiceSchema = z.object({ body: invoiceBody.partial().extend({ items: z.array(invoiceItemBody).min(1).max(500).optional() }), query: z.object({}).strict(), params: paramsId });
exports.invoiceListSchema = z.object({ body: emptyBody, query: listQuery({ kind: z.enum(['sale', 'purchase']).optional(), status: z.enum(['active', 'cancelled', 'void']).optional(), warehouseId: optionalObjectId, warehouse_id: optionalObjectId, customerId: optionalObjectId, customer_id: optionalObjectId, supplierId: optionalObjectId, supplier_id: optionalObjectId, paymentStatus: z.enum(['paid', 'partial', 'unpaid']).optional(), payment_status: z.enum(['paid', 'partial', 'unpaid']).optional() }), params: z.object({}).strict() });
exports.cancelSchema = z.object({ body: z.object({ reason: z.string().max(1000).optional().default('') }).strict(), query: z.object({}).strict(), params: paramsId });

const returnBody = z.object({
  kind: z.enum(['sales', 'purchase']),
  number: z.string().max(80).optional(),
  date: z.string().max(40).optional(),
  invoiceId: optionalObjectId,
  invoice_id: optionalObjectId,
  warehouseId: objectId,
  warehouse_id: objectId.optional(),
  customerId: optionalObjectId,
  customer_id: optionalObjectId,
  supplierId: optionalObjectId,
  supplier_id: optionalObjectId,
  reason: z.string().max(1000).optional().default(''),
  refund: z.coerce.number().min(0).optional().default(0),
  items: z.array(invoiceItemBody.omit({ unit: true, unitFactor: true, unit_factor: true }).extend({ price: z.coerce.number().min(0).optional().default(0) })).min(1).max(500)
}).strict();
exports.createReturnSchema = z.object({ body: returnBody, query: z.object({}).strict(), params: z.object({}).strict() });
exports.updateReturnSchema = z.object({ body: returnBody.partial().extend({ items: z.array(invoiceItemBody.omit({ unit: true, unitFactor: true, unit_factor: true }).extend({ price: z.coerce.number().min(0).optional().default(0) })).min(1).max(500).optional() }), query: z.object({}).strict(), params: paramsId });
exports.returnListSchema = z.object({ body: emptyBody, query: listQuery({ kind: z.enum(['sales', 'purchase']).optional(), status: z.enum(['active', 'cancelled']).optional(), warehouseId: optionalObjectId, warehouse_id: optionalObjectId }), params: z.object({}).strict() });

const transferItemBody = z.object({ productId: objectId, product_id: objectId.optional(), qty: z.coerce.number().min(0.0001) }).passthrough();
const transferBodyBase = z.object({
  number: z.string().max(80).optional(),
  date: z.string().max(40).optional(),
  fromWarehouseId: objectId,
  from_warehouse_id: objectId.optional(),
  toWarehouseId: objectId,
  to_warehouse_id: objectId.optional(),
  items: z.array(transferItemBody).min(1).max(500),
  notes: z.string().max(1000).optional().default(''),
  status: z.enum(['pending', 'completed', 'cancelled']).optional().default('completed')
}).strict();
const transferBody = transferBodyBase.refine((v) => v.fromWarehouseId !== v.toWarehouseId, 'fromWarehouseId and toWarehouseId must be different');
exports.createTransferSchema = z.object({ body: transferBody, query: z.object({}).strict(), params: z.object({}).strict() });
exports.updateTransferSchema = z.object({ body: transferBodyBase.partial().extend({ items: z.array(transferItemBody).min(1).max(500).optional() }), query: z.object({}).strict(), params: paramsId });
exports.transferListSchema = z.object({ body: emptyBody, query: listQuery({ status: z.enum(['pending', 'completed', 'cancelled']).optional(), warehouseId: optionalObjectId, warehouse_id: optionalObjectId }), params: z.object({}).strict() });

const countItemBody = z.object({ productId: objectId, product_id: objectId.optional(), countedQty: z.coerce.number().min(0), counted_qty: z.coerce.number().min(0).optional(), note: z.string().max(500).optional().default('') }).passthrough();
const countBody = z.object({
  number: z.string().max(80).optional(),
  date: z.string().max(40).optional(),
  warehouseId: objectId,
  warehouse_id: objectId.optional(),
  items: z.array(countItemBody).min(1).max(1000),
  notes: z.string().max(1000).optional().default(''),
  status: z.enum(['draft', 'applied', 'cancelled']).optional().default('applied')
}).strict();
exports.createCountSchema = z.object({ body: countBody, query: z.object({}).strict(), params: z.object({}).strict() });
exports.updateCountSchema = z.object({ body: countBody.partial().extend({ items: z.array(countItemBody).min(1).max(1000).optional() }), query: z.object({}).strict(), params: paramsId });
exports.countListSchema = z.object({ body: emptyBody, query: listQuery({ status: z.enum(['draft', 'applied', 'cancelled']).optional(), warehouseId: optionalObjectId, warehouse_id: optionalObjectId }), params: z.object({}).strict() });

const treasuryBody = z.object({
  date: z.string().max(40).optional(),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1).max(160),
  amount: z.coerce.number().min(0),
  description: z.string().max(1000).optional().default(''),
  warehouseId: optionalObjectId,
  warehouse_id: optionalObjectId,
  sourceType: z.enum(['manual', 'sale', 'purchase', 'sales_return', 'purchase_return', 'invoice_cancel', 'opening']).optional().default('manual'),
  source_type: z.enum(['manual', 'sale', 'purchase', 'sales_return', 'purchase_return', 'invoice_cancel', 'opening']).optional()
}).strict();
exports.createTreasurySchema = z.object({ body: treasuryBody, query: z.object({}).strict(), params: z.object({}).strict() });
exports.updateTreasurySchema = z.object({ body: treasuryBody.partial(), query: z.object({}).strict(), params: paramsId });
exports.treasuryListSchema = z.object({ body: emptyBody, query: listQuery({ type: z.enum(['income', 'expense']).optional(), warehouseId: optionalObjectId, warehouse_id: optionalObjectId, sourceType: z.string().max(80).optional(), source_type: z.string().max(80).optional() }), params: z.object({}).strict() });
exports.reportSchema = z.object({ body: emptyBody, query: listQuery({ type: z.enum(['sales', 'purchases', 'profits', 'stock', 'customers', 'suppliers', 'treasury', 'stock-movement']).optional().default('sales'), warehouseId: optionalObjectId, warehouse_id: optionalObjectId }), params: z.object({}).strict() });

function meta(p, total) { return { page: p.page, limit: p.limit, total, pages: Math.ceil(total / p.limit) }; }
function rx(value) { return new RegExp(escapeRegex(value), 'i'); }
function id(value) {
  if (!value) return null;
  if (value._id) return String(value._id);
  if (typeof value === 'object' && typeof value.toString === 'function') return value.toString();
  return String(value);
}
function asObjectId(value) { return value ? new mongoose.Types.ObjectId(String(value)) : null; }
function normalizeDate(value) { return value ? new Date(value) : new Date(); }
function dateFilter(query = {}, field = 'date') {
  const from = query.from || query.dateFrom;
  const to = query.to || query.dateTo;
  const filter = {};
  if (from || to) {
    filter[field] = {};
    if (from) filter[field].$gte = new Date(`${String(from).slice(0, 10)}T00:00:00.000Z`);
    if (to) filter[field].$lte = new Date(`${String(to).slice(0, 10)}T23:59:59.999Z`);
  }
  return filter;
}
function mapToObject(value = {}) {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  return { ...value };
}
function sumStock(product) {
  return Object.values(mapToObject(product.stock)).reduce((sum, value) => sum + Number(value || 0), 0);
}
function productStockInWarehouse(product, warehouseId) { return Number(mapToObject(product.stock)[String(warehouseId)] || 0); }
function normalizeProductPayload(body = {}) {
  const categoryId = body.categoryId || body.category_id || null;
  const supplierId = body.supplierId || body.supplier_id || null;
  const salePrice = body.salePrice ?? body.sale_price ?? 0;
  const unit = body.unit || 'Piece';
  const unitFactor = body.unitFactor ?? body.unit_factor ?? 1;
  const units = Array.isArray(body.units) && body.units.length ? body.units : [{ name: unit, factor: unitFactor, salePrice }];
  return {
    code: body.code,
    barcode: body.barcode || '',
    name: body.name,
    categoryId,
    unit,
    unitFactor,
    purchasePrice: body.purchasePrice ?? body.purchase_price ?? 0,
    salePrice,
    minStock: body.minStock ?? body.min_stock ?? 0,
    stock: body.stock || {},
    units,
    supplierId,
    notes: body.notes || '',
    status: body.status || 'active'
  };
}
function productDto(p) {
  const stock = mapToObject(p.stock);
  return {
    id: id(p), code: p.code, barcode: p.barcode || '', name: p.name,
    categoryId: id(p.categoryId), category_id: id(p.categoryId), category: p.categoryId?.name || '',
    unit: p.unit || 'Piece', unitFactor: p.unitFactor || 1, unit_factor: p.unitFactor || 1,
    purchasePrice: p.purchasePrice || 0, purchase_price: p.purchasePrice || 0,
    salePrice: p.salePrice || 0, sale_price: p.salePrice || 0,
    minStock: p.minStock || 0, min_stock: p.minStock || 0,
    stock, totalStock: Object.values(stock).reduce((sum, value) => sum + Number(value || 0), 0), total_stock: Object.values(stock).reduce((sum, value) => sum + Number(value || 0), 0),
    units: p.units || [], supplierId: id(p.supplierId), supplier_id: id(p.supplierId), supplier: p.supplierId?.name || '',
    notes: p.notes || '', status: p.status || 'active', createdAt: p.createdAt, created_at: p.createdAt, updatedAt: p.updatedAt, updated_at: p.updatedAt
  };
}
function categoryDto(c) { return { id: id(c), name: c.name, description: c.description || '', status: c.status || 'active', createdAt: c.createdAt, created_at: c.createdAt, updatedAt: c.updatedAt, updated_at: c.updatedAt }; }
function warehouseDto(w) { return { id: id(w), name: w.name, code: w.code, address: w.address || '', manager: w.manager || '', phone: w.phone || '', status: w.status || 'active', createdAt: w.createdAt, created_at: w.createdAt, updatedAt: w.updatedAt, updated_at: w.updatedAt }; }
function personDto(p) { return { id: id(p), type: p.type, name: p.name, phone: p.phone || '', email: p.email || '', address: p.address || '', openingBalance: p.openingBalance || 0, opening_balance: p.openingBalance || 0, balanceType: p.balanceType || 'debit', balance_type: p.balanceType || 'debit', notes: p.notes || '', status: p.status || 'active', createdAt: p.createdAt, created_at: p.createdAt, updatedAt: p.updatedAt, updated_at: p.updatedAt }; }
function lineTotal(item) { return Math.max(0, Number(item.qty || 0) * Number(item.price || 0) - Number(item.discount || 0)); }
function paymentStatus(doc) { if (Number(doc.due || 0) <= 0) return 'paid'; if (Number(doc.paid || 0) <= 0) return 'unpaid'; return 'partial'; }
function invoiceDto(inv) {
  return {
    id: id(inv), kind: inv.kind, type: inv.kind, number: inv.number, date: inv.date,
    warehouseId: id(inv.warehouseId), warehouse_id: id(inv.warehouseId), warehouse: inv.warehouseId?.name || '',
    customerId: id(inv.customerId), customer_id: id(inv.customerId), customer: inv.customerId?.name || '',
    supplierId: id(inv.supplierId), supplier_id: id(inv.supplierId), supplier: inv.supplierId?.name || '',
    paymentMethod: inv.paymentMethod, payment_method: inv.paymentMethod,
    discount: inv.discount || 0, paid: inv.paid || 0, subtotal: inv.subtotal || 0, total: inv.total || 0, due: inv.due || 0, profit: inv.profit || 0,
    paymentStatus: paymentStatus(inv), payment_status: paymentStatus(inv), notes: inv.notes || '', status: inv.status || 'active',
    items: (inv.items || []).map((x) => ({ productId: id(x.productId), product_id: id(x.productId), name: x.name || x.productId?.name || '', code: x.code || x.productId?.code || '', barcode: x.barcode || x.productId?.barcode || '', unit: x.unit || 'Piece', unitFactor: x.unitFactor || 1, unit_factor: x.unitFactor || 1, qty: x.qty, price: x.price, purchasePrice: x.purchasePrice || 0, purchase_price: x.purchasePrice || 0, discount: x.discount || 0, total: lineTotal(x) })),
    createdAt: inv.createdAt, created_at: inv.createdAt, updatedAt: inv.updatedAt, updated_at: inv.updatedAt, cancelledAt: inv.cancelledAt, cancellationReason: inv.cancellationReason || ''
  };
}
function returnDto(row) { return { id: id(row), kind: row.kind, number: row.number, date: row.date, invoiceId: id(row.invoiceId), invoice_id: id(row.invoiceId), warehouseId: id(row.warehouseId), warehouse_id: id(row.warehouseId), warehouse: row.warehouseId?.name || '', customerId: id(row.customerId), customer_id: id(row.customerId), customer: row.customerId?.name || '', supplierId: id(row.supplierId), supplier_id: id(row.supplierId), supplier: row.supplierId?.name || '', reason: row.reason || '', refund: row.refund || 0, total: row.total || 0, status: row.status || 'active', items: (row.items || []).map((x) => ({ productId: id(x.productId), product_id: id(x.productId), product: x.productId?.name || '', qty: x.qty, price: x.price || 0, discount: x.discount || 0, total: lineTotal(x) })), createdAt: row.createdAt, created_at: row.createdAt, updatedAt: row.updatedAt, updated_at: row.updatedAt }; }
function transferDto(row) { return { id: id(row), number: row.number, date: row.date, fromWarehouseId: id(row.fromWarehouseId), from_warehouse_id: id(row.fromWarehouseId), fromWarehouse: row.fromWarehouseId?.name || '', toWarehouseId: id(row.toWarehouseId), to_warehouse_id: id(row.toWarehouseId), toWarehouse: row.toWarehouseId?.name || '', items: (row.items || []).map((x) => ({ productId: id(x.productId), product_id: id(x.productId), product: x.productId?.name || '', qty: x.qty })), notes: row.notes || '', status: row.status || 'completed', createdAt: row.createdAt, created_at: row.createdAt, updatedAt: row.updatedAt, updated_at: row.updatedAt }; }
function countDto(row) { return { id: id(row), number: row.number, date: row.date, warehouseId: id(row.warehouseId), warehouse_id: id(row.warehouseId), warehouse: row.warehouseId?.name || '', items: (row.items || []).map((x) => ({ productId: id(x.productId), product_id: id(x.productId), product: x.productId?.name || '', currentQty: x.currentQty || 0, current_qty: x.currentQty || 0, countedQty: x.countedQty || 0, counted_qty: x.countedQty || 0, difference: x.difference || 0, note: x.note || '' })), notes: row.notes || '', status: row.status || 'applied', createdAt: row.createdAt, created_at: row.createdAt, updatedAt: row.updatedAt, updated_at: row.updatedAt }; }
function treasuryDto(row) { return { id: id(row), date: row.date, type: row.type, category: row.category, amount: row.amount || 0, description: row.description || '', warehouseId: id(row.warehouseId), warehouse_id: id(row.warehouseId), warehouse: row.warehouseId?.name || '', sourceType: row.sourceType, source_type: row.sourceType, sourceId: id(row.sourceId), source_id: id(row.sourceId), createdAt: row.createdAt, created_at: row.createdAt, updatedAt: row.updatedAt, updated_at: row.updatedAt }; }
async function requireDoc(Model, docId, label) { if (!docId || !isValidObjectId(String(docId))) throw new AppError(`${label} not found`, 404); const doc = await Model.findById(docId); if (!doc) throw new AppError(`${label} not found`, 404); return doc; }
async function nextNumber(Model, prefix) { const count = await Model.countDocuments(); return `${prefix}-${String(count + 1).padStart(4, '0')}`; }
async function adjustStock(productId, warehouseId, delta, allowNegative = false) {
  const product = await requireDoc(StoreProduct, productId, 'Product');
  const key = String(warehouseId);
  const stock = mapToObject(product.stock);
  const current = Number(stock[key] || 0);
  const next = current + Number(delta || 0);
  if (!allowNegative && next < 0) throw new AppError(`Insufficient stock for ${product.name}`, 409, { productId: id(product), warehouseId: key, current, requestedDelta: delta });
  stock[key] = Math.max(0, next);
  product.stock = stock;
  await product.save();
  return product;
}
async function deleteSourceTreasury(sourceId) { await StoreTreasuryMovement.deleteMany({ sourceId: asObjectId(sourceId) }); }
async function addTreasuryFromInvoice(inv, reverse = false) {
  if (!Number(inv.paid || 0)) return;
  const isSale = inv.kind === 'sale';
  const type = reverse ? (isSale ? 'expense' : 'income') : (isSale ? 'income' : 'expense');
  await StoreTreasuryMovement.create({ date: inv.date || new Date(), type, category: reverse ? 'Invoice cancellation' : (isSale ? 'Sales invoice' : 'Purchase invoice'), amount: inv.paid, description: `${reverse ? 'Reverse ' : ''}${inv.number}`, warehouseId: inv.warehouseId, sourceType: reverse ? 'invoice_cancel' : inv.kind, sourceId: inv._id });
}
async function addTreasuryFromReturn(ret, reverse = false) {
  if (!Number(ret.refund || 0)) return;
  const isSalesReturn = ret.kind === 'sales';
  const type = reverse ? (isSalesReturn ? 'income' : 'expense') : (isSalesReturn ? 'expense' : 'income');
  await StoreTreasuryMovement.create({ date: ret.date || new Date(), type, category: reverse ? 'Return reversal' : (isSalesReturn ? 'Sales return refund' : 'Purchase return refund'), amount: ret.refund, description: `${reverse ? 'Reverse ' : ''}${ret.number}`, warehouseId: ret.warehouseId, sourceType: isSalesReturn ? 'sales_return' : 'purchase_return', sourceId: ret._id });
}
async function hydrateInvoiceItems(items) {
  const productIds = items.map((x) => x.productId || x.product_id);
  const products = await StoreProduct.find({ _id: { $in: productIds } });
  const byId = new Map(products.map((p) => [String(p._id), p]));
  if (products.length !== new Set(productIds.map(String)).size) throw new AppError('Some products were not found', 404);
  return items.map((item) => {
    const productId = item.productId || item.product_id;
    const p = byId.get(String(productId));
    const unitFactor = item.unitFactor ?? item.unit_factor ?? 1;
    return { productId, name: p.name, code: p.code, barcode: p.barcode || '', unit: item.unit || p.unit || 'Piece', unitFactor, qty: item.qty, price: item.price, purchasePrice: p.purchasePrice || 0, discount: item.discount || 0 };
  });
}
function calculateInvoice(kind, items, discount = 0, paid = 0) {
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const total = Math.max(0, subtotal - Number(discount || 0));
  const due = Math.max(0, total - Number(paid || 0));
  const profit = kind === 'sale' ? items.reduce((sum, item) => sum + lineTotal(item) - Number(item.purchasePrice || 0) * Number(item.qty || 0) * Number(item.unitFactor || 1), 0) - Number(discount || 0) : 0;
  return { subtotal, total, due, profit };
}
async function applyInvoiceEffects(inv) {
  if (inv.status !== 'active') return;
  for (const item of inv.items || []) {
    const baseQty = Number(item.qty || 0) * Number(item.unitFactor || 1);
    await adjustStock(item.productId, inv.warehouseId, inv.kind === 'sale' ? -baseQty : baseQty);
  }
  await addTreasuryFromInvoice(inv, false);
}
async function reverseInvoiceEffects(inv) {
  if (inv.status !== 'active') return;
  for (const item of inv.items || []) {
    const baseQty = Number(item.qty || 0) * Number(item.unitFactor || 1);
    await adjustStock(item.productId, inv.warehouseId, inv.kind === 'sale' ? baseQty : -baseQty, true);
  }
  await deleteSourceTreasury(inv._id);
}
async function applyReturnEffects(ret) {
  if (ret.status !== 'active') return;
  for (const item of ret.items || []) await adjustStock(item.productId, ret.warehouseId, ret.kind === 'sales' ? item.qty : -item.qty, true);
  await addTreasuryFromReturn(ret, false);
}
async function reverseReturnEffects(ret) {
  if (ret.status !== 'active') return;
  for (const item of ret.items || []) await adjustStock(item.productId, ret.warehouseId, ret.kind === 'sales' ? -item.qty : item.qty, true);
  await deleteSourceTreasury(ret._id);
}
async function applyTransferEffects(row) {
  if (row.status !== 'completed') return;
  for (const item of row.items || []) { await adjustStock(item.productId, row.fromWarehouseId, -item.qty); await adjustStock(item.productId, row.toWarehouseId, item.qty, true); }
}
async function reverseTransferEffects(row) {
  if (row.status !== 'completed') return;
  for (const item of row.items || []) { await adjustStock(item.productId, row.fromWarehouseId, item.qty, true); await adjustStock(item.productId, row.toWarehouseId, -item.qty, true); }
}
async function logAction(req, action, message, metadata = {}) { try { await systemLog({ type: 'admin_action', action, actorId: req.authUser?._id, actorRole: req.authRole, message, metadata }); } catch (_) {} }

function searchFilter(query, fields) { if (!query.q) return {}; const pattern = rx(query.q); return { $or: fields.map((f) => ({ [f]: pattern })) }; }
async function list(Model, filter, sort, p, populate = []) { let query = Model.find(filter).sort(sort).skip(p.skip).limit(p.limit); populate.forEach((x) => { query = query.populate(x); }); const [rows, total] = await Promise.all([query.lean({ virtuals: true }), Model.countDocuments(filter)]); return { rows, total }; }

exports.overview = asyncHandler(async (req, res) => {
  const [products, warehouses, customers, suppliers, sales, purchases, returnsRows, movements] = await Promise.all([
    StoreProduct.find().lean(), StoreWarehouse.countDocuments(), StorePerson.countDocuments({ type: 'customer' }), StorePerson.countDocuments({ type: 'supplier' }),
    StoreInvoice.find({ kind: 'sale', status: 'active' }).sort({ date: -1 }).limit(10).lean(), StoreInvoice.find({ kind: 'purchase', status: 'active' }).lean(),
    StoreReturn.find({ status: 'active' }).lean(), StoreTreasuryMovement.find().lean()
  ]);
  const totalStock = products.reduce((sum, p) => sum + sumStock(p), 0);
  const stockValue = products.reduce((sum, p) => sum + sumStock(p) * Number(p.purchasePrice || 0), 0);
  const lowStock = products.filter((p) => sumStock(p) > 0 && sumStock(p) <= Number(p.minStock || 0)).length;
  const outOfStock = products.filter((p) => sumStock(p) <= 0).length;
  const salesTotal = sales.reduce((sum, x) => sum + Number(x.total || 0), 0);
  const purchasesTotal = purchases.reduce((sum, x) => sum + Number(x.total || 0), 0);
  const profit = sales.reduce((sum, x) => sum + Number(x.profit || 0), 0);
  const returnsTotal = returnsRows.reduce((sum, x) => sum + Number(x.total || x.refund || 0), 0);
  const treasury = movements.reduce((sum, x) => sum + (x.type === 'income' ? Number(x.amount || 0) : -Number(x.amount || 0)), 0);
  return success(res, { metrics: { products: products.length, warehouses, customers, suppliers, totalStock, total_stock: totalStock, stockValue, stock_value: stockValue, lowStock, low_stock: lowStock, outOfStock, out_of_stock: outOfStock, salesTotal, sales_total: salesTotal, purchasesTotal, purchases_total: purchasesTotal, profit, returnsTotal, returns_total: returnsTotal, treasuryBalance: treasury, treasury_balance: treasury }, recentSales: sales.map(invoiceDto) }, 'Retail overview loaded');
});

exports.categories = asyncHandler(async (req, res) => { const p = pagination(req.validated.query); const filter = searchFilter(req.validated.query, ['name', 'description']); const { rows, total } = await list(StoreCategory, filter, { createdAt: -1 }, p); return success(res, { data: rows.map(categoryDto), pagination: meta(p, total) }, 'Categories loaded'); });
exports.getCategory = asyncHandler(async (req, res) => success(res, categoryDto(await requireDoc(StoreCategory, req.validated.params.id, 'Category')), 'Category loaded'));
exports.createCategory = asyncHandler(async (req, res) => { const row = await StoreCategory.create(req.validated.body); await logAction(req, 'retail.categories.create', 'Store category created', { id: row._id }); return success(res, categoryDto(row), 'Category created', 201); });
exports.updateCategory = asyncHandler(async (req, res) => { const row = await requireDoc(StoreCategory, req.validated.params.id, 'Category'); Object.assign(row, req.validated.body); await row.save(); await logAction(req, 'retail.categories.update', 'Store category updated', { id: row._id }); return success(res, categoryDto(row), 'Category updated'); });
exports.deleteCategory = asyncHandler(async (req, res) => { const deleted = await StoreCategory.findByIdAndDelete(req.validated.params.id); if (!deleted) throw new AppError('Category not found', 404); await logAction(req, 'retail.categories.delete', 'Store category deleted', { id: deleted._id }); return success(res, { deleted: true }, 'Category deleted'); });

exports.warehouses = asyncHandler(async (req, res) => { const p = pagination(req.validated.query); const filter = searchFilter(req.validated.query, ['name', 'code', 'address', 'manager']); if (req.validated.query.status) filter.status = req.validated.query.status; const { rows, total } = await list(StoreWarehouse, filter, { createdAt: -1 }, p); return success(res, { data: rows.map(warehouseDto), pagination: meta(p, total) }, 'Warehouses loaded'); });
exports.getWarehouse = asyncHandler(async (req, res) => success(res, warehouseDto(await requireDoc(StoreWarehouse, req.validated.params.id, 'Warehouse')), 'Warehouse loaded'));
exports.createWarehouse = asyncHandler(async (req, res) => { const row = await StoreWarehouse.create(req.validated.body); await logAction(req, 'retail.warehouses.create', 'Warehouse created', { id: row._id }); return success(res, warehouseDto(row), 'Warehouse created', 201); });
exports.updateWarehouse = asyncHandler(async (req, res) => { const row = await requireDoc(StoreWarehouse, req.validated.params.id, 'Warehouse'); Object.assign(row, req.validated.body); await row.save(); await logAction(req, 'retail.warehouses.update', 'Warehouse updated', { id: row._id }); return success(res, warehouseDto(row), 'Warehouse updated'); });
exports.deleteWarehouse = asyncHandler(async (req, res) => { const deleted = await StoreWarehouse.findByIdAndDelete(req.validated.params.id); if (!deleted) throw new AppError('Warehouse not found', 404); await logAction(req, 'retail.warehouses.delete', 'Warehouse deleted', { id: deleted._id }); return success(res, { deleted: true }, 'Warehouse deleted'); });
exports.warehouseStock = asyncHandler(async (req, res) => { await requireDoc(StoreWarehouse, req.validated.params.id, 'Warehouse'); const products = await StoreProduct.find({ [`stock.${req.validated.params.id}`]: { $exists: true } }).populate('categoryId').lean({ virtuals: true }); const data = products.map((p) => ({ ...productDto(p), warehouseStock: productStockInWarehouse(p, req.validated.params.id), warehouse_stock: productStockInWarehouse(p, req.validated.params.id) })); return success(res, { data }, 'Warehouse stock loaded'); });

exports.products = asyncHandler(async (req, res) => {
  const p = pagination(req.validated.query); const q = req.validated.query; const filter = searchFilter(q, ['name', 'code', 'barcode', 'searchText']);
  if (q.categoryId || q.category_id) filter.categoryId = q.categoryId || q.category_id; if (q.status) filter.status = q.status;
  const { rows, total } = await list(StoreProduct, filter, { createdAt: -1 }, p, ['categoryId', 'supplierId']);
  let data = rows.map(productDto);
  if (q.warehouseId || q.warehouse_id) { const wh = q.warehouseId || q.warehouse_id; data = data.filter((x) => Number(x.stock?.[wh] || 0) > 0); }
  if (q.lowStock || q.low_stock) data = data.filter((x) => x.totalStock > 0 && x.totalStock <= Number(x.minStock || 0));
  return success(res, { data, pagination: meta(p, total) }, 'Products loaded');
});
exports.lookupProduct = asyncHandler(async (req, res) => {
  const query = req.validated.query;
  const rawValue = String(query.value || query.barcode || query.code || query.q || '')
    .replace(/[\r\n\t]/g, '')
    .trim();
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const normalizedValue = rawValue
    .replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persianDigits.indexOf(digit)));
  const candidates = Array.from(new Set([rawValue, normalizedValue].filter(Boolean)));
  const exactExpressions = candidates.map((value) => new RegExp(`^${escapeRegex(value)}$`, 'i'));
  const exactConditions = exactExpressions.flatMap((expression) => ([
    { barcode: expression },
    { code: expression },
    { name: expression },
  ]));

  let row = await StoreProduct.findOne({ status: 'active', $or: exactConditions })
    .populate('categoryId')
    .populate('supplierId');

  // Some scanners add prefixes/suffixes or spaces. Use a safe partial match as a fallback.
  if (!row) {
    const partialConditions = candidates.flatMap((value) => {
      const expression = new RegExp(escapeRegex(value), 'i');
      return [{ barcode: expression }, { code: expression }, { name: expression }, { searchText: expression }];
    });
    row = await StoreProduct.findOne({ status: 'active', $or: partialConditions })
      .sort({ name: 1 })
      .populate('categoryId')
      .populate('supplierId');
  }

  if (!row) throw new AppError('Product not found', 404);
  const data = productDto(row);
  const warehouseId = query.warehouseId || query.warehouse_id;
  if (warehouseId) {
    data.warehouseStock = Number(data.stock?.[String(warehouseId)] || 0);
    data.warehouse_stock = data.warehouseStock;
  }
  return success(res, data, 'Product loaded');
});

exports.getProduct = asyncHandler(async (req, res) => { const row = await StoreProduct.findById(req.validated.params.id).populate('categoryId').populate('supplierId'); if (!row) throw new AppError('Product not found', 404); return success(res, productDto(row), 'Product loaded'); });
exports.createProduct = asyncHandler(async (req, res) => { const payload = normalizeProductPayload(req.validated.body); const row = await StoreProduct.create(payload); await row.populate('categoryId'); await row.populate('supplierId'); await logAction(req, 'retail.products.create', 'Product created', { id: row._id }); return success(res, productDto(row), 'Product created', 201); });
exports.updateProduct = asyncHandler(async (req, res) => { const row = await requireDoc(StoreProduct, req.validated.params.id, 'Product'); const payload = normalizeProductPayload({ ...productDto(row), ...req.validated.body }); Object.assign(row, payload); await row.save(); await row.populate('categoryId'); await row.populate('supplierId'); await logAction(req, 'retail.products.update', 'Product updated', { id: row._id }); return success(res, productDto(row), 'Product updated'); });
exports.deleteProduct = asyncHandler(async (req, res) => { const deleted = await StoreProduct.findByIdAndDelete(req.validated.params.id); if (!deleted) throw new AppError('Product not found', 404); await logAction(req, 'retail.products.delete', 'Product deleted', { id: deleted._id }); return success(res, { deleted: true }, 'Product deleted'); });
function csvToProducts(csv = '') { const lines = csv.split(/\r?\n/).map((x) => x.trim()).filter(Boolean); if (!lines.length) return []; const headers = lines.shift().split(',').map((h) => h.trim()); return lines.map((line) => { const cols = line.split(',').map((c) => c.trim()); return headers.reduce((obj, h, i) => { obj[h] = cols[i] || ''; return obj; }, {}); }); }
exports.importProducts = asyncHandler(async (req, res) => { const rows = req.validated.body.products || csvToProducts(req.validated.body.csv); const results = []; for (const item of rows) { const payload = normalizeProductPayload({ unit: 'Piece', ...item, purchasePrice: item.purchasePrice || item.purchase_price || 0, salePrice: item.salePrice || item.sale_price || 0, minStock: item.minStock || item.min_stock || 0 }); const row = await StoreProduct.findOneAndUpdate({ code: payload.code }, { $set: payload }, { upsert: true, new: true, setDefaultsOnInsert: true }); results.push(productDto(row)); } await logAction(req, 'retail.products.import', 'Products imported', { count: results.length }); return success(res, { data: results, imported: results.length }, 'Products imported', 201); });
exports.priceLabels = asyncHandler(async (req, res) => { const filter = {}; if (req.validated.body.productIds?.length) filter._id = { $in: req.validated.body.productIds }; const rows = await StoreProduct.find(filter).sort({ name: 1 }).lean({ virtuals: true }); return success(res, { data: rows.map((p) => ({ id: id(p), code: p.code, barcode: p.barcode || '', name: p.name, salePrice: p.salePrice || 0, sale_price: p.salePrice || 0, unit: p.unit || 'Piece' })) }, 'Price labels loaded'); });

function peopleController(type) {
  return {
    list: asyncHandler(async (req, res) => { const p = pagination(req.validated.query); const filter = { type, ...searchFilter(req.validated.query, ['name', 'phone', 'email', 'address']) }; if (req.validated.query.status) filter.status = req.validated.query.status; const { rows, total } = await list(StorePerson, filter, { createdAt: -1 }, p); return success(res, { data: rows.map(personDto), pagination: meta(p, total) }, `${type}s loaded`); }),
    get: asyncHandler(async (req, res) => { const row = await requireDoc(StorePerson, req.validated.params.id, type); if (row.type !== type) throw new AppError(`${type} not found`, 404); return success(res, personDto(row), `${type} loaded`); }),
    create: asyncHandler(async (req, res) => { const body = req.validated.body; const row = await StorePerson.create({ ...body, type, openingBalance: body.openingBalance ?? body.opening_balance ?? 0, balanceType: body.balanceType ?? body.balance_type ?? 'debit' }); await logAction(req, `retail.${type}s.create`, `${type} created`, { id: row._id }); return success(res, personDto(row), `${type} created`, 201); }),
    update: asyncHandler(async (req, res) => { const row = await requireDoc(StorePerson, req.validated.params.id, type); if (row.type !== type) throw new AppError(`${type} not found`, 404); const body = req.validated.body; Object.assign(row, { ...body, openingBalance: body.openingBalance ?? body.opening_balance ?? row.openingBalance, balanceType: body.balanceType ?? body.balance_type ?? row.balanceType }); await row.save(); await logAction(req, `retail.${type}s.update`, `${type} updated`, { id: row._id }); return success(res, personDto(row), `${type} updated`); }),
    delete: asyncHandler(async (req, res) => { const deleted = await StorePerson.findOneAndDelete({ _id: req.validated.params.id, type }); if (!deleted) throw new AppError(`${type} not found`, 404); await logAction(req, `retail.${type}s.delete`, `${type} deleted`, { id: deleted._id }); return success(res, { deleted: true }, `${type} deleted`); })
  };
}
exports.customers = peopleController('customer').list; exports.getCustomer = peopleController('customer').get; exports.createCustomer = peopleController('customer').create; exports.updateCustomer = peopleController('customer').update; exports.deleteCustomer = peopleController('customer').delete;
exports.suppliers = peopleController('supplier').list; exports.getSupplier = peopleController('supplier').get; exports.createSupplier = peopleController('supplier').create; exports.updateSupplier = peopleController('supplier').update; exports.deleteSupplier = peopleController('supplier').delete;

async function createInvoice(req, res, kind) {
  const body = req.validated.body; const warehouseId = body.warehouseId || body.warehouse_id; await requireDoc(StoreWarehouse, warehouseId, 'Warehouse');
  if (kind === 'sale' && (body.customerId || body.customer_id)) { const p = await requireDoc(StorePerson, body.customerId || body.customer_id, 'Customer'); if (p.type !== 'customer') throw new AppError('Customer not found', 404); }
  if (kind === 'purchase' && (body.supplierId || body.supplier_id)) { const p = await requireDoc(StorePerson, body.supplierId || body.supplier_id, 'Supplier'); if (p.type !== 'supplier') throw new AppError('Supplier not found', 404); }
  const items = await hydrateInvoiceItems(body.items); const calc = calculateInvoice(kind, items, body.discount, body.paid);
  const row = await StoreInvoice.create({ kind, number: body.number || await nextNumber(StoreInvoice, kind === 'sale' ? 'SAL' : 'PUR'), date: normalizeDate(body.date), warehouseId, customerId: body.customerId || body.customer_id || null, supplierId: body.supplierId || body.supplier_id || null, paymentMethod: body.paymentMethod || body.payment_method || 'cash', discount: body.discount || 0, paid: body.paid || 0, notes: body.notes || '', items, ...calc, createdBy: req.authUser?._id });
  await applyInvoiceEffects(row); await row.populate(['warehouseId', 'customerId', 'supplierId', 'items.productId']); await logAction(req, `retail.${kind}.create`, `${kind} invoice created`, { id: row._id }); return success(res, invoiceDto(row), `${kind} invoice created`, 201);
}
exports.createSaleInvoice = asyncHandler((req, res) => createInvoice(req, res, 'sale'));
exports.createPurchaseInvoice = asyncHandler((req, res) => createInvoice(req, res, 'purchase'));
exports.posCheckout = exports.createSaleInvoice;
async function listInvoices(req, res, forcedKind = null) { const p = pagination(req.validated.query); const q = req.validated.query; const filter = { ...dateFilter(q) }; if (forcedKind || q.kind) filter.kind = forcedKind || q.kind; if (q.status) filter.status = q.status; if (q.warehouseId || q.warehouse_id) filter.warehouseId = q.warehouseId || q.warehouse_id; if (q.customerId || q.customer_id) filter.customerId = q.customerId || q.customer_id; if (q.supplierId || q.supplier_id) filter.supplierId = q.supplierId || q.supplier_id; if (q.q) filter.$or = [{ number: rx(q.q) }, { notes: rx(q.q) }]; const { rows, total } = await list(StoreInvoice, filter, { date: -1, createdAt: -1 }, p, ['warehouseId', 'customerId', 'supplierId', 'items.productId']); let data = rows.map(invoiceDto); const pay = q.paymentStatus || q.payment_status; if (pay) data = data.filter((x) => x.paymentStatus === pay); return success(res, { data, pagination: meta(p, total) }, 'Invoices loaded'); }
exports.invoices = asyncHandler((req, res) => listInvoices(req, res)); exports.salesInvoices = asyncHandler((req, res) => listInvoices(req, res, 'sale')); exports.purchaseInvoices = asyncHandler((req, res) => listInvoices(req, res, 'purchase'));
exports.getInvoice = asyncHandler(async (req, res) => { const row = await StoreInvoice.findById(req.validated.params.id).populate(['warehouseId', 'customerId', 'supplierId', 'items.productId']); if (!row) throw new AppError('Invoice not found', 404); return success(res, invoiceDto(row), 'Invoice loaded'); });
async function updateInvoice(req, res, forcedKind = null) { const row = await StoreInvoice.findById(req.validated.params.id); if (!row || (forcedKind && row.kind !== forcedKind)) throw new AppError('Invoice not found', 404); await reverseInvoiceEffects(row); const body = req.validated.body; const kind = forcedKind || row.kind; const items = body.items ? await hydrateInvoiceItems(body.items) : row.items; const discount = body.discount ?? row.discount; const paid = body.paid ?? row.paid; const calc = calculateInvoice(kind, items, discount, paid); Object.assign(row, { number: body.number || row.number, date: body.date ? normalizeDate(body.date) : row.date, warehouseId: body.warehouseId || body.warehouse_id || row.warehouseId, customerId: body.customerId || body.customer_id || row.customerId, supplierId: body.supplierId || body.supplier_id || row.supplierId, paymentMethod: body.paymentMethod || body.payment_method || row.paymentMethod, discount, paid, notes: body.notes ?? row.notes, items, ...calc, status: 'active', cancelledAt: null, cancellationReason: '' }); await row.save(); await applyInvoiceEffects(row); await row.populate(['warehouseId', 'customerId', 'supplierId', 'items.productId']); await logAction(req, `retail.${kind}.update`, `${kind} invoice updated`, { id: row._id }); return success(res, invoiceDto(row), 'Invoice updated'); }
exports.updateInvoice = asyncHandler((req, res) => updateInvoice(req, res)); exports.updateSaleInvoice = asyncHandler((req, res) => updateInvoice(req, res, 'sale')); exports.updatePurchaseInvoice = asyncHandler((req, res) => updateInvoice(req, res, 'purchase'));
exports.cancelInvoice = asyncHandler(async (req, res) => { const row = await StoreInvoice.findById(req.validated.params.id); if (!row) throw new AppError('Invoice not found', 404); await reverseInvoiceEffects(row); row.status = 'cancelled'; row.cancelledAt = new Date(); row.cancellationReason = req.validated.body.reason || ''; await row.save(); await row.populate(['warehouseId', 'customerId', 'supplierId', 'items.productId']); await logAction(req, 'retail.invoices.cancel', 'Invoice cancelled', { id: row._id }); return success(res, invoiceDto(row), 'Invoice cancelled'); });
exports.deleteInvoice = asyncHandler(async (req, res) => { const row = await StoreInvoice.findById(req.validated.params.id); if (!row) throw new AppError('Invoice not found', 404); await reverseInvoiceEffects(row); await row.deleteOne(); await logAction(req, 'retail.invoices.delete', 'Invoice deleted', { id: row._id }); return success(res, { deleted: true }, 'Invoice deleted'); });

async function createReturn(req, res) { const body = req.validated.body; const warehouseId = body.warehouseId || body.warehouse_id; const items = body.items.map((x) => ({ productId: x.productId || x.product_id, qty: x.qty, price: x.price || 0, discount: x.discount || 0 })); const total = items.reduce((sum, x) => sum + lineTotal(x), 0); const row = await StoreReturn.create({ kind: body.kind, number: body.number || await nextNumber(StoreReturn, body.kind === 'sales' ? 'SRET' : 'PRET'), date: normalizeDate(body.date), invoiceId: body.invoiceId || body.invoice_id || null, warehouseId, customerId: body.customerId || body.customer_id || null, supplierId: body.supplierId || body.supplier_id || null, reason: body.reason || '', refund: body.refund || total, items, total, createdBy: req.authUser?._id }); await applyReturnEffects(row); await row.populate(['warehouseId', 'customerId', 'supplierId', 'invoiceId', 'items.productId']); await logAction(req, 'retail.returns.create', 'Return created', { id: row._id }); return success(res, returnDto(row), 'Return created', 201); }
exports.createReturn = asyncHandler(createReturn);
exports.returns = asyncHandler(async (req, res) => { const p = pagination(req.validated.query); const q = req.validated.query; const filter = { ...dateFilter(q) }; if (q.kind) filter.kind = q.kind; if (q.status) filter.status = q.status; if (q.warehouseId || q.warehouse_id) filter.warehouseId = q.warehouseId || q.warehouse_id; if (q.q) filter.$or = [{ number: rx(q.q) }, { reason: rx(q.q) }]; const { rows, total } = await list(StoreReturn, filter, { date: -1 }, p, ['warehouseId', 'customerId', 'supplierId', 'invoiceId', 'items.productId']); return success(res, { data: rows.map(returnDto), pagination: meta(p, total) }, 'Returns loaded'); });
exports.getReturn = asyncHandler(async (req, res) => { const row = await StoreReturn.findById(req.validated.params.id).populate(['warehouseId', 'customerId', 'supplierId', 'invoiceId', 'items.productId']); if (!row) throw new AppError('Return not found', 404); return success(res, returnDto(row), 'Return loaded'); });
exports.updateReturn = asyncHandler(async (req, res) => { const row = await StoreReturn.findById(req.validated.params.id); if (!row) throw new AppError('Return not found', 404); await reverseReturnEffects(row); const body = req.validated.body; const items = body.items ? body.items.map((x) => ({ productId: x.productId || x.product_id, qty: x.qty, price: x.price || 0, discount: x.discount || 0 })) : row.items; const total = items.reduce((sum, x) => sum + lineTotal(x), 0); Object.assign(row, { ...body, warehouseId: body.warehouseId || body.warehouse_id || row.warehouseId, invoiceId: body.invoiceId || body.invoice_id || row.invoiceId, customerId: body.customerId || body.customer_id || row.customerId, supplierId: body.supplierId || body.supplier_id || row.supplierId, date: body.date ? normalizeDate(body.date) : row.date, items, total, refund: body.refund ?? row.refund ?? total, status: 'active' }); await row.save(); await applyReturnEffects(row); await row.populate(['warehouseId', 'customerId', 'supplierId', 'invoiceId', 'items.productId']); return success(res, returnDto(row), 'Return updated'); });
exports.cancelReturn = asyncHandler(async (req, res) => { const row = await StoreReturn.findById(req.validated.params.id); if (!row) throw new AppError('Return not found', 404); await reverseReturnEffects(row); row.status = 'cancelled'; await row.save(); await row.populate(['warehouseId', 'customerId', 'supplierId', 'invoiceId', 'items.productId']); return success(res, returnDto(row), 'Return cancelled'); });
exports.deleteReturn = asyncHandler(async (req, res) => { const row = await StoreReturn.findById(req.validated.params.id); if (!row) throw new AppError('Return not found', 404); await reverseReturnEffects(row); await row.deleteOne(); return success(res, { deleted: true }, 'Return deleted'); });

exports.transfers = asyncHandler(async (req, res) => { const p = pagination(req.validated.query); const q = req.validated.query; const filter = { ...dateFilter(q) }; if (q.status) filter.status = q.status; if (q.warehouseId || q.warehouse_id) { const wh = q.warehouseId || q.warehouse_id; filter.$or = [{ fromWarehouseId: wh }, { toWarehouseId: wh }]; } if (q.q) filter.number = rx(q.q); const { rows, total } = await list(StoreTransfer, filter, { date: -1 }, p, ['fromWarehouseId', 'toWarehouseId', 'items.productId']); return success(res, { data: rows.map(transferDto), pagination: meta(p, total) }, 'Transfers loaded'); });
exports.createTransfer = asyncHandler(async (req, res) => { const body = req.validated.body; const row = await StoreTransfer.create({ number: body.number || await nextNumber(StoreTransfer, 'TR'), date: normalizeDate(body.date), fromWarehouseId: body.fromWarehouseId || body.from_warehouse_id, toWarehouseId: body.toWarehouseId || body.to_warehouse_id, items: body.items.map((x) => ({ productId: x.productId || x.product_id, qty: x.qty })), notes: body.notes || '', status: body.status || 'completed', createdBy: req.authUser?._id }); await applyTransferEffects(row); await row.populate(['fromWarehouseId', 'toWarehouseId', 'items.productId']); return success(res, transferDto(row), 'Transfer created', 201); });
exports.getTransfer = asyncHandler(async (req, res) => { const row = await StoreTransfer.findById(req.validated.params.id).populate(['fromWarehouseId', 'toWarehouseId', 'items.productId']); if (!row) throw new AppError('Transfer not found', 404); return success(res, transferDto(row), 'Transfer loaded'); });
exports.updateTransfer = asyncHandler(async (req, res) => { const row = await StoreTransfer.findById(req.validated.params.id); if (!row) throw new AppError('Transfer not found', 404); await reverseTransferEffects(row); const body = req.validated.body; Object.assign(row, { number: body.number || row.number, date: body.date ? normalizeDate(body.date) : row.date, fromWarehouseId: body.fromWarehouseId || body.from_warehouse_id || row.fromWarehouseId, toWarehouseId: body.toWarehouseId || body.to_warehouse_id || row.toWarehouseId, items: body.items ? body.items.map((x) => ({ productId: x.productId || x.product_id, qty: x.qty })) : row.items, notes: body.notes ?? row.notes, status: body.status || row.status }); await row.save(); await applyTransferEffects(row); await row.populate(['fromWarehouseId', 'toWarehouseId', 'items.productId']); return success(res, transferDto(row), 'Transfer updated'); });
exports.cancelTransfer = asyncHandler(async (req, res) => { const row = await StoreTransfer.findById(req.validated.params.id); if (!row) throw new AppError('Transfer not found', 404); await reverseTransferEffects(row); row.status = 'cancelled'; await row.save(); await row.populate(['fromWarehouseId', 'toWarehouseId', 'items.productId']); return success(res, transferDto(row), 'Transfer cancelled'); });
exports.deleteTransfer = asyncHandler(async (req, res) => { const row = await StoreTransfer.findById(req.validated.params.id); if (!row) throw new AppError('Transfer not found', 404); await reverseTransferEffects(row); await row.deleteOne(); return success(res, { deleted: true }, 'Transfer deleted'); });

exports.counts = asyncHandler(async (req, res) => { const p = pagination(req.validated.query); const q = req.validated.query; const filter = { ...dateFilter(q) }; if (q.status) filter.status = q.status; if (q.warehouseId || q.warehouse_id) filter.warehouseId = q.warehouseId || q.warehouse_id; if (q.q) filter.number = rx(q.q); const { rows, total } = await list(StoreInventoryCount, filter, { date: -1 }, p, ['warehouseId', 'items.productId']); return success(res, { data: rows.map(countDto), pagination: meta(p, total) }, 'Inventory counts loaded'); });
exports.createCount = asyncHandler(async (req, res) => { const body = req.validated.body; const warehouseId = body.warehouseId || body.warehouse_id; await requireDoc(StoreWarehouse, warehouseId, 'Warehouse'); const items = []; for (const item of body.items) { const productId = item.productId || item.product_id; const product = await requireDoc(StoreProduct, productId, 'Product'); const currentQty = productStockInWarehouse(product, warehouseId); const countedQty = item.countedQty ?? item.counted_qty; items.push({ productId, currentQty, countedQty, difference: Number(countedQty) - Number(currentQty), note: item.note || '' }); if ((body.status || 'applied') === 'applied') { const stock = mapToObject(product.stock); stock[String(warehouseId)] = countedQty; product.stock = stock; await product.save(); } } const row = await StoreInventoryCount.create({ number: body.number || await nextNumber(StoreInventoryCount, 'CNT'), date: normalizeDate(body.date), warehouseId, items, notes: body.notes || '', status: body.status || 'applied', createdBy: req.authUser?._id }); await row.populate(['warehouseId', 'items.productId']); return success(res, countDto(row), 'Inventory count saved', 201); });
exports.getCount = asyncHandler(async (req, res) => { const row = await StoreInventoryCount.findById(req.validated.params.id).populate(['warehouseId', 'items.productId']); if (!row) throw new AppError('Inventory count not found', 404); return success(res, countDto(row), 'Inventory count loaded'); });
exports.updateCount = asyncHandler(async (req, res) => { const row = await StoreInventoryCount.findById(req.validated.params.id); if (!row) throw new AppError('Inventory count not found', 404); Object.assign(row, req.validated.body); await row.save(); await row.populate(['warehouseId', 'items.productId']); return success(res, countDto(row), 'Inventory count updated'); });
exports.deleteCount = asyncHandler(async (req, res) => { const deleted = await StoreInventoryCount.findByIdAndDelete(req.validated.params.id); if (!deleted) throw new AppError('Inventory count not found', 404); return success(res, { deleted: true }, 'Inventory count deleted'); });

exports.treasury = asyncHandler(async (req, res) => { const p = pagination(req.validated.query); const q = req.validated.query; const filter = { ...dateFilter(q) }; if (q.type) filter.type = q.type; if (q.warehouseId || q.warehouse_id) filter.warehouseId = q.warehouseId || q.warehouse_id; if (q.sourceType || q.source_type) filter.sourceType = q.sourceType || q.source_type; if (q.q) filter.$or = [{ category: rx(q.q) }, { description: rx(q.q) }]; const { rows, total } = await list(StoreTreasuryMovement, filter, { date: -1 }, p, ['warehouseId']); const totals = await StoreTreasuryMovement.aggregate([{ $match: filter }, { $group: { _id: '$type', amount: { $sum: '$amount' } } }]); const income = totals.find((x) => x._id === 'income')?.amount || 0; const expense = totals.find((x) => x._id === 'expense')?.amount || 0; return success(res, { data: rows.map(treasuryDto), summary: { income, expense, balance: income - expense }, pagination: meta(p, total) }, 'Treasury movements loaded'); });
exports.createTreasury = asyncHandler(async (req, res) => { const body = req.validated.body; const row = await StoreTreasuryMovement.create({ ...body, warehouseId: body.warehouseId || body.warehouse_id || null, sourceType: body.sourceType || body.source_type || 'manual', date: normalizeDate(body.date), createdBy: req.authUser?._id }); await row.populate('warehouseId'); return success(res, treasuryDto(row), 'Treasury movement created', 201); });
exports.getTreasury = asyncHandler(async (req, res) => { const row = await StoreTreasuryMovement.findById(req.validated.params.id).populate('warehouseId'); if (!row) throw new AppError('Treasury movement not found', 404); return success(res, treasuryDto(row), 'Treasury movement loaded'); });
exports.updateTreasury = asyncHandler(async (req, res) => { const row = await StoreTreasuryMovement.findById(req.validated.params.id); if (!row) throw new AppError('Treasury movement not found', 404); const body = req.validated.body; Object.assign(row, { ...body, warehouseId: body.warehouseId || body.warehouse_id || row.warehouseId, sourceType: body.sourceType || body.source_type || row.sourceType, date: body.date ? normalizeDate(body.date) : row.date }); await row.save(); await row.populate('warehouseId'); return success(res, treasuryDto(row), 'Treasury movement updated'); });
exports.deleteTreasury = asyncHandler(async (req, res) => { const deleted = await StoreTreasuryMovement.findByIdAndDelete(req.validated.params.id); if (!deleted) throw new AppError('Treasury movement not found', 404); return success(res, { deleted: true }, 'Treasury movement deleted'); });

exports.report = asyncHandler(async (req, res) => {
  const q = req.validated.query;
  const type = q.type || 'sales';
  const dates = dateFilter(q);
  const warehouseId = q.warehouseId || q.warehouse_id;

  if (type === 'sales' || type === 'purchases' || type === 'profits') {
    const kind = type === 'purchases' ? 'purchase' : 'sale';
    const filter = { kind, status: 'active', ...dates };
    if (warehouseId) filter.warehouseId = warehouseId;
    const rows = await StoreInvoice.find(filter)
      .populate(['warehouseId', 'customerId', 'supplierId'])
      .sort({ date: -1 })
      .lean({ virtuals: true });
    const data = rows.map(invoiceDto);
    const total = data.reduce((sum, row) => sum + row.total, 0);
    const profit = data.reduce((sum, row) => sum + row.profit, 0);
    return success(res, { type, data, summary: { count: data.length, total, profit } }, 'Report loaded');
  }

  if (type === 'stock') {
    const rows = await StoreProduct.find().populate('categoryId').sort({ name: 1 }).lean({ virtuals: true });
    const data = rows.map(productDto).map((product) => {
      const scopedStock = warehouseId ? { [String(warehouseId)]: Number(product.stock?.[String(warehouseId)] || 0) } : product.stock;
      const totalStock = Object.values(scopedStock || {}).reduce((sum, value) => sum + Number(value || 0), 0);
      return {
        ...product,
        stock: scopedStock,
        totalStock,
        total_stock: totalStock,
        stockValue: totalStock * product.purchasePrice,
        stock_value: totalStock * product.purchasePrice,
        saleValue: totalStock * product.salePrice,
        sale_value: totalStock * product.salePrice,
        warehouseId: warehouseId || '',
        warehouse_id: warehouseId || '',
      };
    });
    return success(res, {
      type,
      data,
      summary: {
        products: data.length,
        totalStock: data.reduce((sum, row) => sum + row.totalStock, 0),
        stockValue: data.reduce((sum, row) => sum + row.stockValue, 0),
        saleValue: data.reduce((sum, row) => sum + row.saleValue, 0),
      },
    }, 'Report loaded');
  }

  if (type === 'customers' || type === 'suppliers') {
    const personType = type === 'customers' ? 'customer' : 'supplier';
    const partyField = personType === 'customer' ? 'customerId' : 'supplierId';
    const invoiceKind = personType === 'customer' ? 'sale' : 'purchase';
    const invoiceFilter = { kind: invoiceKind, status: 'active', ...dates };
    if (warehouseId) invoiceFilter.warehouseId = warehouseId;
    const [people, invoices] = await Promise.all([
      StorePerson.find({ type: personType }).sort({ name: 1 }).lean({ virtuals: true }),
      StoreInvoice.find(invoiceFilter).select(`${partyField} total paid due`).lean(),
    ]);
    const balances = new Map();
    for (const invoice of invoices) {
      const key = String(invoice[partyField] || '');
      if (!key) continue;
      const current = balances.get(key) || { invoices: 0, total: 0, paid: 0, due: 0 };
      current.invoices += 1;
      current.total += Number(invoice.total || 0);
      current.paid += Number(invoice.paid || 0);
      current.due += Number(invoice.due || 0);
      balances.set(key, current);
    }
    const data = people.map((person) => ({ ...personDto(person), ...(balances.get(String(person._id)) || { invoices: 0, total: 0, paid: 0, due: 0 }) }));
    return success(res, { type, data, summary: { count: data.length, due: data.reduce((sum, row) => sum + row.due, 0) } }, 'Report loaded');
  }

  if (type === 'treasury') {
    const filter = { ...dates };
    if (warehouseId) filter.warehouseId = warehouseId;
    const rows = await StoreTreasuryMovement.find(filter).populate('warehouseId').sort({ date: -1 }).lean({ virtuals: true });
    const data = rows.map(treasuryDto);
    const income = data.filter((row) => row.type === 'income').reduce((sum, row) => sum + row.amount, 0);
    const expense = data.filter((row) => row.type === 'expense').reduce((sum, row) => sum + row.amount, 0);
    return success(res, { type, data, summary: { income, expense, balance: income - expense } }, 'Report loaded');
  }

  const transferFilter = { ...dates };
  const countFilter = { ...dates };
  const invoiceFilter = { ...dates };
  const returnFilter = { ...dates };
  if (warehouseId) {
    transferFilter.$or = [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }];
    countFilter.warehouseId = warehouseId;
    invoiceFilter.warehouseId = warehouseId;
    returnFilter.warehouseId = warehouseId;
  }
  const [transfers, counts, invoices, returnsRows] = await Promise.all([
    StoreTransfer.find(transferFilter).populate(['fromWarehouseId', 'toWarehouseId', 'items.productId']).sort({ date: -1 }).lean({ virtuals: true }),
    StoreInventoryCount.find(countFilter).populate(['warehouseId', 'items.productId']).sort({ date: -1 }).lean({ virtuals: true }),
    StoreInvoice.find(invoiceFilter).populate(['warehouseId', 'items.productId']).sort({ date: -1 }).lean({ virtuals: true }),
    StoreReturn.find(returnFilter).populate(['warehouseId', 'items.productId']).sort({ date: -1 }).lean({ virtuals: true }),
  ]);
  return success(res, {
    type,
    data: {
      transfers: transfers.map(transferDto),
      inventoryCounts: counts.map(countDto),
      invoices: invoices.map(invoiceDto),
      returns: returnsRows.map(returnDto),
    },
    summary: { transfers: transfers.length, counts: counts.length, invoices: invoices.length, returns: returnsRows.length },
  }, 'Report loaded');
});
