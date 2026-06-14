# Retail / MATGR Backend Endpoints

All endpoints are authenticated admin endpoints. The browser dashboard uses the secure HttpOnly session cookies and sends `credentials: "include"`. State-changing requests must include `X-CSRF-Token` from the `adwety_csrf` cookie.

Base URL examples:

- `http://localhost:6500/api/v1/admin/products`
- `http://localhost:6500/api/v1/admin/retail/products`

Both direct module paths and `/retail/*` aliases are supported for easier frontend integration.

## Overview and Reports

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/admin/retail-dashboard` | Retail dashboard metrics and recent sales |
| GET | `/api/v1/admin/overview` | Same overview alias |
| GET | `/api/v1/admin/business-reports?type=sales` | Reports page |
| GET | `/api/v1/admin/reports?type=stock` | Reports alias |

Supported report types: `sales`, `purchases`, `profits`, `stock`, `customers`, `suppliers`, `treasury`, `stock-movement`.

## Products and Categories

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/v1/admin/products` | List/create products |
| GET/PATCH/DELETE | `/api/v1/admin/products/:id` | Read/update/delete product |
| POST | `/api/v1/admin/products/import` | Import products from `{ products: [...] }` or `{ csv: "..." }` |
| POST | `/api/v1/admin/products/price-labels` | Return printable price label data |
| GET/POST | `/api/v1/admin/categories` | List/create retail categories |
| GET/PATCH/DELETE | `/api/v1/admin/categories/:id` | Read/update/delete category |

Products support barcode, code, purchase/sale price, min stock, warehouse stock map, and multiple sale units.

## Warehouses and Stock

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/v1/admin/warehouses` | List/create warehouses |
| GET/PATCH/DELETE | `/api/v1/admin/warehouses/:id` | Read/update/delete warehouse |
| GET | `/api/v1/admin/warehouses/:id/stock` | Warehouse stock modal data |
| GET/POST | `/api/v1/admin/transfers` | Warehouse transfers |
| POST | `/api/v1/admin/transfers/:id/cancel` | Cancel transfer and reverse stock effect |
| GET/POST | `/api/v1/admin/inventory-counts` | Stocktake / inventory counts |

## Customers and Suppliers

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/v1/admin/customers` | List/create customers |
| GET/PATCH/DELETE | `/api/v1/admin/customers/:id` | Read/update/delete customer |
| GET/POST | `/api/v1/admin/suppliers` | List/create suppliers |
| GET/PATCH/DELETE | `/api/v1/admin/suppliers/:id` | Read/update/delete supplier |

## POS, Invoices and Returns

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/admin/pos/checkout` | Create sales invoice from POS |
| GET/POST | `/api/v1/admin/sales-invoices` | List/create sales invoices |
| GET/PATCH/DELETE | `/api/v1/admin/sales-invoices/:id` | Read/update/delete sales invoice |
| POST | `/api/v1/admin/sales-invoices/:id/cancel` | Cancel/Void sales invoice |
| GET/POST | `/api/v1/admin/purchases` | List/create purchase invoices |
| GET/PATCH/DELETE | `/api/v1/admin/purchases/:id` | Read/update/delete purchase invoice |
| POST | `/api/v1/admin/purchases/:id/cancel` | Cancel purchase invoice |
| GET | `/api/v1/admin/invoices` | Combined invoices list |
| GET/POST | `/api/v1/admin/returns` | List/create sales or purchase returns |
| POST | `/api/v1/admin/returns/:id/cancel` | Cancel return and reverse stock/treasury effect |

Sales invoices deduct stock and create income treasury movement for paid amount. Purchase invoices add stock and create expense treasury movement for paid amount.

## Treasury

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/api/v1/admin/treasury` | List/create treasury movements with filters |
| GET/PATCH/DELETE | `/api/v1/admin/treasury/:id` | Read/update/delete movement |

Filters: `q`, `from`, `to`, `type`, `warehouseId`, `sourceType`, `page`, `limit`.

## Demo Data

Run:

```bash
npm run seed
```

Demo admin login:

```text
admin@adwety.app / Password123
```
