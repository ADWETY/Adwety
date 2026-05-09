# API Details

All endpoints are mounted at `/api` and `/api/v1`.

## Auth

`POST /api/auth/register`

```json
{ "fullName": "Omar", "email": "omar@example.com", "password": "Password123", "role": "patient" }
```

`POST /api/auth/login`

```json
{ "email": "omar@example.com", "password": "Password123" }
```

Use returned token as:

```http
Authorization: Bearer <token>
```

## Inventory sync

`POST /api/inventory/sync`

```json
{
  "pharmacyId": "<pharmacy_id>",
  "inventory": [
    { "drugId": "<drug_id>", "quantity": 10, "price": 35.5 }
  ]
}
```

The backend stores snapshots only and does not perform sales or POS transactions.

## Main search

`GET /api/search?drug=panadol&lat=30.0444&lng=31.2357&radius_km=20`

Returns pharmacy name, distance, available quantity, last updated time, and matched drug.

## AI prescription

`POST /api/ai/prescription` as multipart with field `image` or `prescription`, or JSON/text with `text`/`mock_text` in development.

Optional `lat` and `lng` return nearby pharmacies for extracted drugs.
