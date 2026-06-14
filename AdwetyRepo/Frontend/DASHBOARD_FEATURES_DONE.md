# Dashboard Feature Update

This frontend package was updated to keep the existing ADWETY web dashboard style while adding the operational features visible in the reference dashboard screenshots.

## Added feature areas

- Point of Sale screen with product search/barcode style search, cart, discount, paid amount, change, and checkout confirmation.
- Products management with add, edit, delete, barcode, category, warehouse, purchase price, sale price, stock and minimum stock.
- Categories management with add, edit, delete and search.
- Warehouses & Transfers with warehouse cards, transfer creation, pending/completed/cancelled statuses.
- Customers management with add, edit, delete, details modal and balances.
- Suppliers management with add, edit, delete, details modal and balances.
- Invoices screen with invoice totals, status, profit, line-item details, and mark-paid confirmation.
- Returns screen that creates return records and updates product stock and treasury expenses.
- Treasury screen for income, expenses, balance, transaction creation and deletion.
- Reports screen with date range filters, sales/profit/returns/expenses/stock value cards, top products, invoice report, print and CSV export.
- Dashboard overview cards for sales, profit, invoices, low/out stock, treasury, latest invoices, low stock and transfers.

## Notes

- The implementation is frontend-only and stores the new module data in browser localStorage.
- All create/update/delete/checkout/return/transfer/treasury actions show a confirmation step before applying the change.
- Arabic and English labels were added for the new screens.
- Production build was tested successfully using `npm run build`.
