# Bahamas Frontend - Retail/MATGR Detailed Update

## What was added in this version

This version completes the missing front-end details from the MATGR dashboard screenshots, while keeping the new modules working with LocalStorage demo data until backend APIs are implemented.

### POS / Point of Sale
- Product cards with product name, code, barcode, price and available stock.
- Product search by name, code, barcode and category.
- Barcode-reader input: scan barcode or type barcode/code then press Enter to add the product automatically.
- Camera barcode scanner UI using the browser BarcodeDetector API when supported.
- Customer and warehouse selection.
- Qty, price and line discount editing.
- Invoice discount, paid amount, due amount and notes.
- Save invoice and update stock locally.
- Thermal/receipt-style print preview.

### Invoices
- Combined sales and purchase invoice list.
- Invoice details modal.
- Professional invoice print layout with company header, invoice metadata, line items, totals and QR/reference placeholder.
- Edit invoice modal with editable date, party, warehouse, payment method, discount, paid, notes and line items.
- Cancel/Void invoice action with stock reversal.
- Delete invoice action with stock reversal.
- Advanced filters:
  - Type: all/sales/purchases
  - Warehouse
  - Party/customer/supplier
  - Status: active/canceled
  - Payment status: paid/partial/unpaid
  - From date / To date
  - General search
- CSV export and print.

### Returns
- Sales returns and purchase returns.
- Select source invoice.
- Select returned product.
- Qty, refund amount and reason.
- Automatic local stock reversal.
- Returns table includes date, invoice, product, qty, refund and reason.

### Treasury
- Manual income and expense entries.
- Automatic rows from sales, purchases and returns.
- Current balance cards.
- CSV export and print.

### Reports
- Advanced report selector:
  - Sales report
  - Purchases report
  - Profit report
  - Stock valuation
  - Customer balances
  - Supplier balances
  - Treasury report
  - Stock movement
- Date range filter.
- Warehouse filter for stock/movement/sales/purchase reports.
- CSV export and print.

### Existing Retail Modules Kept
- Retail Dashboard.
- Products catalog.
- Categories.
- Warehouses.
- Customers.
- Suppliers.
- Warehouse transfers.

## Important note
All new retail modules are front-end features backed by LocalStorage demo data. Backend API integration is still separate work.

## Run

```bash
npm install
npm run dev
```

## Build check

```bash
npm run build
```

The production build was tested successfully after this update.

## Full Details Patch - Stocktake / Import / Labels / UI Matching

This update completes the previously missing frontend details from the MATGR dashboard screenshots:

- Added MATGR-style top retail tabs across retail screens.
- Added `/inventory-count` Stocktake page for warehouse stock counting.
- Added stocktake workflow: select warehouse, load products, enter counted quantities, calculate differences, apply adjustments, and store stocktake history.
- Added product import from CSV text with sample CSV.
- Added printable product price labels / shelf labels.
- Added multiple sale units table per product with unit name, conversion factor, and sale price.
- Added warehouse stock modal from the Warehouses page showing product quantities and purchase value per warehouse.
- Added dashboard sales chart for recent active sales invoices.
- Expanded Treasury page filters: search, date range, transaction type, warehouse, export and print.
- Build check passed with `npm run build`.

Main routes to verify:

- `/retail-dashboard`
- `/products`
- `/warehouses`
- `/inventory-count`
- `/treasury`
- `/business-reports`
