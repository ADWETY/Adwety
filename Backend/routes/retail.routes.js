const router = require('express').Router();
const validate = require('../middleware/validation');
const controller = require('../controllers/retail.controller');
const retailTenant = require('../middleware/retail-tenant');

router.use(retailTenant);

// Retail dashboard overview and business reports.
router.get('/retail-dashboard', validate(controller.listSchema), controller.overview);
router.get('/retail/overview', validate(controller.listSchema), controller.overview);
router.get('/overview', validate(controller.listSchema), controller.overview);
router.get('/business-reports', validate(controller.reportSchema), controller.report);
router.get('/reports', validate(controller.reportSchema), controller.report);
router.get('/retail/reports', validate(controller.reportSchema), controller.report);

// Store categories.
router.get('/categories', validate(controller.listSchema), controller.categories);
router.post('/categories', validate(controller.createCategorySchema), controller.createCategory);
router.get('/categories/:id', validate(controller.byIdSchema), controller.getCategory);
router.patch('/categories/:id', validate(controller.updateCategorySchema), controller.updateCategory);
router.put('/categories/:id', validate(controller.updateCategorySchema), controller.updateCategory);
router.delete('/categories/:id', validate(controller.byIdSchema), controller.deleteCategory);

// Warehouses + stock modal endpoint.
router.get('/warehouses', validate(controller.listSchema), controller.warehouses);
router.post('/warehouses', validate(controller.createWarehouseSchema), controller.createWarehouse);
router.get('/warehouses/:id', validate(controller.byIdSchema), controller.getWarehouse);
router.get('/warehouses/:id/stock', validate(controller.byIdSchema), controller.warehouseStock);
router.patch('/warehouses/:id', validate(controller.updateWarehouseSchema), controller.updateWarehouse);
router.put('/warehouses/:id', validate(controller.updateWarehouseSchema), controller.updateWarehouse);
router.delete('/warehouses/:id', validate(controller.byIdSchema), controller.deleteWarehouse);

// Products, import and price labels.
router.get('/products', validate(controller.productListSchema), controller.products);
router.post('/products', validate(controller.createProductSchema), controller.createProduct);
router.post('/products/import', validate(controller.importProductsSchema), controller.importProducts);
router.post('/products/price-labels', validate(controller.priceLabelsSchema), controller.priceLabels);
// Exact barcode/code lookup must be declared before /products/:id.
router.get('/products/lookup', validate(controller.productLookupSchema), controller.lookupProduct);
router.get('/products/:id', validate(controller.byIdSchema), controller.getProduct);
router.patch('/products/:id', validate(controller.updateProductSchema), controller.updateProduct);
router.put('/products/:id', validate(controller.updateProductSchema), controller.updateProduct);
router.delete('/products/:id', validate(controller.byIdSchema), controller.deleteProduct);

// Customers.
router.get('/customers', validate(controller.personListSchema), controller.customers);
router.post('/customers', validate(controller.createPersonSchema), controller.createCustomer);
router.get('/customers/:id', validate(controller.byIdSchema), controller.getCustomer);
router.patch('/customers/:id', validate(controller.updatePersonSchema), controller.updateCustomer);
router.put('/customers/:id', validate(controller.updatePersonSchema), controller.updateCustomer);
router.delete('/customers/:id', validate(controller.byIdSchema), controller.deleteCustomer);

// Suppliers.
router.get('/suppliers', validate(controller.personListSchema), controller.suppliers);
router.post('/suppliers', validate(controller.createPersonSchema), controller.createSupplier);
router.get('/suppliers/:id', validate(controller.byIdSchema), controller.getSupplier);
router.patch('/suppliers/:id', validate(controller.updatePersonSchema), controller.updateSupplier);
router.put('/suppliers/:id', validate(controller.updatePersonSchema), controller.updateSupplier);
router.delete('/suppliers/:id', validate(controller.byIdSchema), controller.deleteSupplier);

// POS and invoices.
router.post('/pos/checkout', validate(controller.createInvoiceSchema), controller.posCheckout);
router.post('/sales-invoices', validate(controller.createInvoiceSchema), controller.createSaleInvoice);
router.get('/sales-invoices', validate(controller.invoiceListSchema), controller.salesInvoices);
router.get('/sales-invoices/:id', validate(controller.byIdSchema), controller.getInvoice);
router.patch('/sales-invoices/:id', validate(controller.updateInvoiceSchema), controller.updateSaleInvoice);
router.put('/sales-invoices/:id', validate(controller.updateInvoiceSchema), controller.updateSaleInvoice);
router.post('/sales-invoices/:id/cancel', validate(controller.cancelSchema), controller.cancelInvoice);
router.delete('/sales-invoices/:id', validate(controller.byIdSchema), controller.deleteInvoice);

router.post('/purchases', validate(controller.createInvoiceSchema), controller.createPurchaseInvoice);
router.get('/purchases', validate(controller.invoiceListSchema), controller.purchaseInvoices);
router.get('/purchases/:id', validate(controller.byIdSchema), controller.getInvoice);
router.patch('/purchases/:id', validate(controller.updateInvoiceSchema), controller.updatePurchaseInvoice);
router.put('/purchases/:id', validate(controller.updateInvoiceSchema), controller.updatePurchaseInvoice);
router.post('/purchases/:id/cancel', validate(controller.cancelSchema), controller.cancelInvoice);
router.delete('/purchases/:id', validate(controller.byIdSchema), controller.deleteInvoice);

router.get('/invoices', validate(controller.invoiceListSchema), controller.invoices);
router.get('/invoices/:id', validate(controller.byIdSchema), controller.getInvoice);
router.patch('/invoices/:id', validate(controller.updateInvoiceSchema), controller.updateInvoice);
router.put('/invoices/:id', validate(controller.updateInvoiceSchema), controller.updateInvoice);
router.post('/invoices/:id/cancel', validate(controller.cancelSchema), controller.cancelInvoice);
router.delete('/invoices/:id', validate(controller.byIdSchema), controller.deleteInvoice);

// Returns.
router.get('/returns', validate(controller.returnListSchema), controller.returns);
router.post('/returns', validate(controller.createReturnSchema), controller.createReturn);
router.get('/returns/:id', validate(controller.byIdSchema), controller.getReturn);
router.patch('/returns/:id', validate(controller.updateReturnSchema), controller.updateReturn);
router.put('/returns/:id', validate(controller.updateReturnSchema), controller.updateReturn);
router.post('/returns/:id/cancel', validate(controller.cancelSchema), controller.cancelReturn);
router.delete('/returns/:id', validate(controller.byIdSchema), controller.deleteReturn);

// Warehouse transfers.
router.get('/transfers', validate(controller.transferListSchema), controller.transfers);
router.post('/transfers', validate(controller.createTransferSchema), controller.createTransfer);
router.get('/transfers/:id', validate(controller.byIdSchema), controller.getTransfer);
router.patch('/transfers/:id', validate(controller.updateTransferSchema), controller.updateTransfer);
router.put('/transfers/:id', validate(controller.updateTransferSchema), controller.updateTransfer);
router.post('/transfers/:id/cancel', validate(controller.cancelSchema), controller.cancelTransfer);
router.delete('/transfers/:id', validate(controller.byIdSchema), controller.deleteTransfer);

// Inventory counts / stocktake.
router.get('/inventory-count', validate(controller.countListSchema), controller.counts);
router.post('/inventory-count', validate(controller.createCountSchema), controller.createCount);
router.get('/inventory-counts', validate(controller.countListSchema), controller.counts);
router.post('/inventory-counts', validate(controller.createCountSchema), controller.createCount);
router.get('/inventory-counts/:id', validate(controller.byIdSchema), controller.getCount);
router.patch('/inventory-counts/:id', validate(controller.updateCountSchema), controller.updateCount);
router.put('/inventory-counts/:id', validate(controller.updateCountSchema), controller.updateCount);
router.delete('/inventory-counts/:id', validate(controller.byIdSchema), controller.deleteCount);

// Treasury.
router.get('/treasury', validate(controller.treasuryListSchema), controller.treasury);
router.post('/treasury', validate(controller.createTreasurySchema), controller.createTreasury);
router.get('/treasury/:id', validate(controller.byIdSchema), controller.getTreasury);
router.patch('/treasury/:id', validate(controller.updateTreasurySchema), controller.updateTreasury);
router.put('/treasury/:id', validate(controller.updateTreasurySchema), controller.updateTreasury);
router.delete('/treasury/:id', validate(controller.byIdSchema), controller.deleteTreasury);

module.exports = router;
