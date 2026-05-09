# Flutter Mobile Endpoints

These endpoints were added specifically for the uploaded Flutter app. They are mounted at `/v1` and return raw JSON matching the Dart model fields instead of the standard backend response wrapper.

Recommended Flutter base URL for local Android emulator:

```dart
static const String baseUrl = 'http://10.0.2.2:6500/v1';
```

Recommended Flutter base URL for iOS simulator / desktop:

```dart
static const String baseUrl = 'http://127.0.0.1:6500/v1';
```

## Auth

### POST `/v1/login`

Request:

```json
{ "email": "mona@adwety.app", "password": "Password123" }
```

Response matches `UserModel`:

```json
{ "id": "...", "name": "Mona Ahmed", "email": "mona@adwety.app", "role": "patient", "phone_number": "", "pharmacy_id": null, "token": "..." }
```

Aliases:

- `POST /v1/auth/login`
- `POST /v1/register`
- `POST /v1/auth/register`

### GET `/v1/profile`

Requires:

```http
Authorization: Bearer <token>
```

Returns the same shape as `UserModel`.

## Pharmacies

### GET `/v1/pharmacies`

Response matches the Flutter `PharmacyModel` list:

```json
[
  {
    "id": "...",
    "name": "BlueCare Pharmacy",
    "address": "21 Nile Street, Maadi, Cairo",
    "distance_km": 1.2,
    "rating": 4.8,
    "latitude": 30.0368,
    "longitude": 31.209
  }
]
```

Optional query params: `q`, `lat`, `lng`, `radius_km`, `limit`.

### GET `/v1/pharmacies/:id`

Returns:

```json
{
  "pharmacy": { "id": "...", "name": "...", "address": "...", "distance_km": 0, "rating": 4.8, "latitude": 30.0368, "longitude": 31.209 },
  "inventory": [
    {
      "drug": { "id": "...", "name": "Panadol Extra", "strength": "500mg", "form": "Tablet", "description": "..." },
      "pharmacy": { "id": "...", "name": "...", "address": "...", "distance_km": 0, "rating": 4.8, "latitude": 30.0368, "longitude": 31.209 },
      "inventory": { "id": "...", "pharmacy_id": "...", "drug_id": "...", "price": 46.5, "quantity": 22 }
    }
  ]
}
```

## Medicines

### GET `/v1/medicines?q=panadol`

Response matches the Flutter home `MedicineModel` list:

```json
[
  {
    "id": "...",
    "name": "Panadol Extra",
    "category": "Pain relief",
    "price": 46.5,
    "stock_status": "In stock",
    "image_url": "https://...",
    "pharmacy_name": "BlueCare Pharmacy"
  }
]
```

### GET `/v1/medicines/:id`

Response matches `DrugModel`:

```json
{ "id": "...", "name": "Panadol Extra", "strength": "500mg", "form": "Tablet", "description": "..." }
```

## Search

### GET `/v1/search?query=panadol&lat=30.0444&lng=31.2357`

Response matches a list of Flutter `DrugSearchResult` objects:

```json
[
  {
    "drug": { "id": "...", "name": "Panadol Extra", "strength": "500mg", "form": "Tablet", "description": "..." },
    "pharmacy": { "id": "...", "name": "BlueCare Pharmacy", "address": "...", "distance_km": 1.2, "rating": 4.8, "latitude": 30.0368, "longitude": 31.209 },
    "inventory": { "id": "...", "pharmacy_id": "...", "drug_id": "...", "price": 46.5, "quantity": 22 }
  }
]
```

Aliases:

- `GET /v1/search/drugs?q=panadol`
- `GET /v1/drugs/search?q=panadol`
- `GET /v1/drugs?q=panadol`

## Prescription Scan

### POST `/v1/scan/prescription`

Accepts multipart image/PDF or JSON body `{ "text": "..." }`.

Response matches a list of `DrugModel` objects:

```json
[
  { "id": "...", "name": "Panadol Extra", "strength": "500mg", "form": "Tablet", "description": "..." }
]
```

Alias:

- `POST /v1/ai/prescription`

## Demo data

Run:

```bash
npm run seed
```

Then use:

- `mona@adwety.app / Password123`
- `pharmacist@adwety.app / Password123`
- `admin@adwety.app / Password123`
