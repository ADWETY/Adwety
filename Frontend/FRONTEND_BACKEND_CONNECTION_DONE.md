# Frontend ↔ Backend Connection Update

This dashboard version is connected to the Retail/MATGR backend APIs added in the backend package.

## API base URL

The frontend reads the backend URL from:

```env
VITE_API_BASE_URL=http://localhost:6500/api
```

Update this value in `.env` when deploying to your server, for example:

```env
VITE_API_BASE_URL=https://api.adwetycare.me/api
```

## Connected modules

The Retail/MATGR pages now load from and sync with backend endpoints under `/api/admin/*`:

- Categories → `/api/admin/categories`
- Products → `/api/admin/products`
- Warehouses → `/api/admin/warehouses`
- Customers → `/api/admin/customers`
- Suppliers → `/api/admin/suppliers`
- POS / Sales invoices → `/api/admin/sales-invoices`
- Purchases → `/api/admin/purchases`
- Returns → `/api/admin/returns`
- Transfers → `/api/admin/transfers`
- Inventory count → `/api/admin/inventory-count`
- Treasury → `/api/admin/treasury`
- Dashboard metrics → `/api/admin/retail-dashboard`
- Reports data is derived from synced backend data in the reports UI.

## Notes

- The dashboard still keeps a local cache as fallback when the backend is unavailable.
- When the backend is online and the user is logged in with an admin JWT, changes are synced to the backend and then the page refreshes from the database.
- Invoice, return, transfer and inventory count operations are synced through their dedicated backend APIs so stock and treasury effects are handled by the backend.
