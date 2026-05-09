# ADWETY Backend

Complete Node.js + Express + MongoDB backend for ADWETY.

## Implemented modules

- Authentication with JWT, bcrypt password hashing, expiration, protected routes, and role-based access control.
- Roles: `admin`, `pharmacist`, `patient`.
- Pharmacy management with GeoJSON `Point` location and `2dsphere` index.
- Global drugs database with generic names, brand names, aliases, category, dosage form, and strength.
- Inventory snapshot sync from pharmacy POS systems. The backend does not process sales/POS transactions.
- Search engine: drug matching, nearby pharmacies, and available inventory filtering.
- Google Gemini-ready AI prescription analysis with image/PDF/text upload and database matching.
- Drug matching logic: lowercase normalization, Arabic normalization, alias/brand matching, partial matching, fuzzy matching.
- Security: Helmet, CORS, rate limiting, NoSQL injection sanitization, validation, protected routes, and production-safe errors.
- Middleware: auth, role, error, validation, security, upload.
- Admin dashboard APIs for users, pharmacies, drugs, logs, and analytics.
- Logging: system logs, AI logs, sync logs, and login attempt logs.
- Database collections: users, pharmacies, drugs, inventory_snapshots, categories, ai_logs, system_logs.
- Indexing/performance: text index, 2dsphere index, compound inventory indexes, pagination.
- VPS deployment: PM2 ecosystem config and production script.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Healthcheck:

```bash
GET /health
```

All APIs work under both `/api` and `/api/v1`.


## Flutter mobile integration

A Flutter-compatible raw JSON API was added under `/v1` to match the uploaded Flutter models exactly. Use this base URL in Flutter:

```dart
static const String baseUrl = 'http://10.0.2.2:6500/v1'; // Android emulator
// or
static const String baseUrl = 'http://127.0.0.1:6500/v1'; // iOS simulator / desktop
```

Main Flutter endpoints:

| Method | Endpoint | Flutter shape |
| --- | --- | --- |
| POST | `/v1/login` | `UserModel` |
| POST | `/v1/register` | `UserModel` |
| GET | `/v1/profile` | `UserModel` |
| GET | `/v1/pharmacies` | `List<PharmacyModel>` |
| GET | `/v1/pharmacies/:id` | `PharmacyDetailsModel` shape |
| GET | `/v1/medicines?q=` | `List<MedicineModel>` |
| GET | `/v1/medicines/:id` | `DrugModel` |
| GET | `/v1/search?query=&lat=&lng=` | `List<DrugSearchResult>` |
| POST | `/v1/scan/prescription` | `List<DrugModel>` |

Full Flutter endpoint docs are in `docs/FLUTTER_ENDPOINTS.md`.

To seed demo data matching the Flutter mock UI:

```bash
npm run seed
```

## Main endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/pharmacies` | Create pharmacy |
| GET | `/api/pharmacies` | List pharmacies |
| PUT | `/api/pharmacies/:id` | Update pharmacy |
| GET | `/api/drugs` | List drugs |
| GET | `/api/drugs/search` | Search drugs |
| POST | `/api/drugs` | Add drug |
| PUT | `/api/drugs/:id` | Update drug |
| POST | `/api/inventory/sync` | Sync inventory snapshot |
| GET | `/api/search?drug=&lat=&lng=` | Main search engine |
| POST | `/api/ai/prescription` | Analyze prescription |
| GET | `/api/admin/analytics` | Admin analytics |

## VPS deployment

```bash
npm install --omit=dev
npm run pm2:start
npm run pm2:logs
```

Put Nginx and HTTPS in front of the Node process on production VPS.

## Complete dashboard backend

The same admin/dashboard backend is available through both of these base paths so old dashboard work and new dashboard work keep running:

```text
/api/admin
/api/dashboard
/api/v1/admin
/api/v1/dashboard
```

Dashboard login:

```text
POST /api/admin/auth/login
GET  /api/admin/auth/me
```

Dashboard CRUD modules:

| Module | Endpoints |
| --- | --- |
| Users | `GET/POST /users`, `GET/PATCH/PUT/DELETE /users/:id` |
| Pharmacies | `GET/POST /pharmacies`, `GET/PATCH/PUT/DELETE /pharmacies/:id` |
| Drugs | `GET/POST /drugs`, `GET/PATCH/PUT/DELETE /drugs/:id` |
| Categories | `GET/POST /categories`, `GET/PATCH/PUT/DELETE /categories/:id` |
| Inventory | `GET/POST /inventory`, `POST /inventory/sync`, `GET/PATCH/PUT/DELETE /inventory/:id` |
| Logs | `GET /logs`, `GET /ai-logs`, `GET /system-logs`, `GET/DELETE /logs/:id` |
| Analytics | `GET /analytics` |
| Settings | `GET /settings` |

Full dashboard docs are in `docs/DASHBOARD_ENDPOINTS.md`.


## Legacy dashboard frontend paths

The original dashboard frontend paths are preserved under `/api/v1` without changing the URL structure. See `docs/LEGACY_DASHBOARD_ENDPOINTS.md`. Flutter endpoints are separate under `/v1`, and the newer dashboard aliases remain under `/api/admin`, `/api/dashboard`, `/api/v1/admin`, and `/api/v1/dashboard`.
