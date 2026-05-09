# ADWETY Dashboard Backend Endpoints

This backend includes a complete Admin/Dashboard REST API. It is not Firebase.
It is Node.js + Express + MongoDB and uses JWT admin authentication.

## Base URLs

All dashboard routes are available from the same controller through these aliases:

```text
/api/admin
/api/dashboard
/api/v1/admin
/api/v1/dashboard
```

Use any one base path in the dashboard frontend. Recommended:

```text
/api/admin
```

## Authentication

### Login

```text
POST /api/admin/auth/login
```

Body:

```json
{
  "email": "admin@adwety.app",
  "password": "Password123"
}
```

Response:

```json
{
  "success": true,
  "message": "Dashboard login successful",
  "data": {
    "user": {},
    "token": "jwt-token"
  }
}
```

Send the token on all dashboard requests:

```text
Authorization: Bearer <token>
```

### Current admin

```text
GET /api/admin/auth/me
GET /api/admin/me
```

## Users CRUD

```text
GET    /api/admin/users?q=&role=&isActive=&page=&limit=
POST   /api/admin/users
GET    /api/admin/users/:id
PATCH  /api/admin/users/:id
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
```

Create body:

```json
{
  "name": "Dashboard User",
  "email": "user@example.com",
  "password": "Password123",
  "role": "patient",
  "phone_number": "01000000000",
  "is_active": true
}
```

## Pharmacies CRUD

```text
GET    /api/admin/pharmacies?q=&status=&ownerId=&page=&limit=
POST   /api/admin/pharmacies
GET    /api/admin/pharmacies/:id
PATCH  /api/admin/pharmacies/:id
PUT    /api/admin/pharmacies/:id
DELETE /api/admin/pharmacies/:id
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
GET    /api/admin/drugs?q=&category=&isActive=&page=&limit=
POST   /api/admin/drugs
GET    /api/admin/drugs/:id
PATCH  /api/admin/drugs/:id
PUT    /api/admin/drugs/:id
DELETE /api/admin/drugs/:id
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
GET    /api/admin/categories?q=&page=&limit=
POST   /api/admin/categories
GET    /api/admin/categories/:id
PATCH  /api/admin/categories/:id
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
```

## Inventory CRUD and sync

```text
GET    /api/admin/inventory?q=&pharmacyId=&drugId=&lowStock=&page=&limit=
POST   /api/admin/inventory
POST   /api/admin/inventory/sync
GET    /api/admin/inventory/:id
PATCH  /api/admin/inventory/:id
PUT    /api/admin/inventory/:id
DELETE /api/admin/inventory/:id
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
GET    /api/admin/logs?source=system&type=sync&q=&page=&limit=
GET    /api/admin/logs?source=ai&status=completed&q=&page=&limit=
GET    /api/admin/ai-logs?page=&limit=
GET    /api/admin/system-logs?page=&limit=
GET    /api/admin/logs/:id?source=system
DELETE /api/admin/logs/:id?source=system
```

## Analytics and settings

```text
GET /api/admin/analytics
GET /api/admin/settings
```

Analytics returns totals for users, admins, pharmacists, patients, pharmacies, active pharmacies, drugs, categories, inventory items, low stock items, AI logs, failed AI logs, sync logs, login attempts, and recent logs.
