# Legacy Dashboard Endpoints

This backend keeps the original dashboard frontend paths unchanged. The Flutter endpoints and the new admin/dashboard endpoints were added as extra layers only.

## Original dashboard base URL

```txt
/api/v1
```

## Legacy paths that still work

```txt
POST   /api/v1/auth/register
POST   /api/v1/auth/register/verify-otp
POST   /api/v1/auth/login
POST   /api/v1/auth/login/verify-otp
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/logout

GET    /api/v1/profile
GET    /api/v1/profile/me
PATCH  /api/v1/profile
POST   /api/v1/profile/email/request-otp
POST   /api/v1/profile/email/confirm-otp

GET    /api/v1/medicines
GET    /api/v1/medicines/search
POST   /api/v1/medicines
GET    /api/v1/medicines/:id
PUT    /api/v1/medicines/:id
PATCH  /api/v1/medicines/:id
DELETE /api/v1/medicines/:id

GET    /api/v1/pharmacies
POST   /api/v1/pharmacies
GET    /api/v1/pharmacies/:id
PUT    /api/v1/pharmacies/:id
PATCH  /api/v1/pharmacies/:id
DELETE /api/v1/pharmacies/:id

GET    /api/v1/inventory
POST   /api/v1/inventory/sync

POST   /api/v1/prescriptions/scan
POST   /api/v1/prescriptions/scan-auth

GET    /api/v1/notifications

GET    /api/v1/admins
POST   /api/v1/admins
PATCH  /api/v1/admins/:id
PUT    /api/v1/admins/:id
DELETE /api/v1/admins/:id

GET    /api/v1/approval-requests
PATCH  /api/v1/approval-requests/:id/approve
PATCH  /api/v1/approval-requests/:id/reject

GET    /api/v1/analytics
```

## New paths are also still available

```txt
/v1/...              Flutter mobile endpoints
/api/admin/...      Admin backend endpoints
/api/dashboard/...  Dashboard aliases
/api/...            Main backend endpoints
```

Do not change the dashboard frontend base URL or paths. Keep using the same `/api/v1/...` URLs.
