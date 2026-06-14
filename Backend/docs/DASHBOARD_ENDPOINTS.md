# ADWETY Dashboard Backend Endpoints

This backend includes a complete Admin/Dashboard REST API. It is not Firebase.
It is Node.js + Express + MongoDB and uses JWT admin authentication.

## Canonical base URL

```text
/api/v1/admin
```

Historical dashboard aliases are disabled by default and must not be used by new clients.

## Authentication

### Login

```text
POST /api/v1/auth/login
```

Body:

```json
{
  "email": "admin@adwety.app",
  "password": "StrongPassword123!"
}
```

The browser receives `HttpOnly` access and rotating refresh cookies. The JSON response contains user metadata only; it does not expose tokens to JavaScript.

All dashboard requests must use:

```js
fetch(url, { credentials: "include" })
```

For `POST`, `PUT`, `PATCH`, and `DELETE`, read the `adwety_csrf` cookie and send the same value in:

```http
X-CSRF-Token: <csrf-cookie-value>
```

### Current admin

```text
GET /api/v1/auth/me
GET /api/v1/admin/auth/me
```

## Users CRUD

```text
GET    /api/v1/admin/users?q=&role=&isActive=&page=&limit=
POST   /api/v1/admin/users
GET    /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id
PUT    /api/v1/admin/users/:id
DELETE /api/v1/admin/users/:id
```

Create body:

```json
{
  "name": "Dashboard User",
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "role": "patient",
  "phone_number": "01000000000",
  "is_active": true
}
```

## Pharmacies CRUD

```text
GET    /api/v1/admin/pharmacies?q=&status=&ownerId=&page=&limit=
POST   /api/v1/admin/pharmacies
GET    /api/v1/admin/pharmacies/:id
PATCH  /api/v1/admin/pharmacies/:id
PUT    /api/v1/admin/pharmacies/:id
DELETE /api/v1/admin/pharmacies/:id
```

Create body:

```json
{
  "name": "BlueCare Pharmacy",
  "address": "21 Nile Street, Maadi, Cairo",
  "phone": "01000000000",
  "email": "bluecare@example.com",
  "status": "active",
  "latitude": 30.0368,
  "longitude": 31.209,
  "working_hours": "24/7",
  "rating": 4.8
}
```

## Drugs CRUD

```text
GET    /api/v1/admin/drugs?q=&category=&isActive=&page=&limit=
POST   /api/v1/admin/drugs
GET    /api/v1/admin/drugs/:id
PATCH  /api/v1/admin/drugs/:id
PUT    /api/v1/admin/drugs/:id
DELETE /api/v1/admin/drugs/:id
```

Create body:

```json
{
  "generic_name": "Paracetamol",
  "brand_names": ["Panadol", "Adol"],
  "aliases": ["باراسيتامول", "بنادول"],
  "category": "Painkiller",
  "dosage_form": "Tablet",
  "strength": "500mg",
  "description": "Pain reliever and fever reducer."
}
```

## Categories CRUD

```text
GET    /api/v1/admin/categories?q=&page=&limit=
POST   /api/v1/admin/categories
GET    /api/v1/admin/categories/:id
PATCH  /api/v1/admin/categories/:id
PUT    /api/v1/admin/categories/:id
DELETE /api/v1/admin/categories/:id
```

## Inventory CRUD and sync

```text
GET    /api/v1/admin/inventory?q=&pharmacyId=&drugId=&lowStock=&page=&limit=
POST   /api/v1/admin/inventory
POST   /api/v1/admin/inventory/sync
GET    /api/v1/admin/inventory/:id
PATCH  /api/v1/admin/inventory/:id
PUT    /api/v1/admin/inventory/:id
DELETE /api/v1/admin/inventory/:id
```

Single item body:

```json
{
  "pharmacy_id": "<pharmacy_id>",
  "drug_id": "<drug_id>",
  "quantity": 25,
  "price": 42.5
}
```

Bulk sync body:

```json
{
  "pharmacy_id": "<pharmacy_id>",
  "inventory": [
    { "drug_id": "<drug_id>", "quantity": 25, "price": 42.5 }
  ]
}
```

## Logs

```text
GET    /api/v1/admin/logs?source=system&type=sync&q=&page=&limit=
GET    /api/v1/admin/logs?source=ai&status=completed&q=&page=&limit=
GET    /api/v1/admin/ai-logs?page=&limit=
GET    /api/v1/admin/system-logs?page=&limit=
GET    /api/v1/admin/logs/:id?source=system
DELETE /api/v1/admin/logs/:id?source=system
```

## Analytics and settings

```text
GET /api/v1/admin/analytics
GET /api/v1/admin/settings
```

Analytics returns totals for users, admins, pharmacists, patients, pharmacies, active pharmacies, drugs, categories, inventory items, low stock items, AI logs, failed AI logs, sync logs, login attempts, and recent logs.
