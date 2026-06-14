# Core API details

Canonical base URL:

```text
/api/v1
```

## Authentication

Browser dashboard sessions use server-issued cookies:

- `adwety_access`: `HttpOnly`, short-lived access token.
- `adwety_refresh`: `HttpOnly`, rotating refresh token.
- `adwety_csrf`: readable signed CSRF token. Send it as `X-CSRF-Token` on `POST`, `PUT`, `PATCH`, and `DELETE` requests.

Browser clients must use `credentials: "include"`. Access and refresh tokens are not returned to dashboard JavaScript.

Official mobile endpoints under `/api/v1/mobile` continue to use:

```http
Authorization: Bearer <access_token>
```

Access tokens are short-lived and mobile refresh tokens rotate on every refresh.

## Pharmacist inventory

```text
GET  /api/v1/pharmacy/my-inventory
POST /api/v1/inventory/sync
```

For a pharmacist, pharmacy scope is derived from the authenticated account. A pharmacist cannot select another `pharmacyId`. Administrators may use the explicit multi-pharmacy administration workflow.

## Search

```text
GET /api/v1/search?drug=panadol&lat=30.0444&lng=31.2357&radius_km=20
```

## AI prescription scan

```text
POST /api/v1/ai/prescription
POST /api/v1/prescriptions/scan
```

Authentication is mandatory. Requests are quota-limited and accept inspected image/PDF uploads or validated text input. AI-derived strings must still be rendered as text, never injected as HTML by clients.

## Administration

```text
/api/v1/admin
```

Administrator operations require an administrator session; sensitive operations additionally require recent MFA.
