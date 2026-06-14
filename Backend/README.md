# ADWETY Backend

Node.js + Express + MongoDB backend for ADWETY, with Redis-backed abuse protection, short-lived sessions, administrator MFA, tenant-isolated pharmacy inventory, secure OTP flows, private AI-log retention, and content-based upload inspection.

## Canonical API

Only one public API version is official:

```text
/api/v1
```

The mobile response-shape adapter is part of the same version:

```text
/api/v1/mobile
```

Examples:

```text
POST /api/v1/auth/login
GET  /api/v1/drugs
GET  /api/v1/pharmacy/my-inventory
GET  /api/v1/admin/analytics
POST /api/v1/mobile/login
GET  /api/v1/mobile/pharmacies
POST /api/v1/mobile/scan/prescription
```

Historical aliases (`/api`, `/v1`, `/api/v1/dashboard`, and legacy dashboard compatibility routes) are disabled by default. When temporarily enabled for migration, they delegate to the canonical routers, return deprecation headers, and share the same Redis rate-limit buckets. They are disabled in the production Docker configuration.

See `docs/API_VERSIONING.md` before changing any client base URL.

## Main security controls

- Public registration uses strict allowlists and always creates a low-privilege patient account.
- Access tokens expire after 15 minutes; refresh tokens rotate and are revocable.
- Logout, password changes, account disabling, and role changes invalidate prior sessions.
- Administrator TOTP MFA and recent-MFA checks protect sensitive administration operations.
- Redis-backed limits cover login, registration, OTP, refresh, and AI usage across every enabled alias.
- Pharmacist inventory scope is derived from the authenticated user, not a submitted pharmacy ID.
- OTP values are generated cryptographically, stored only as keyed hashes, delivered through SMTP, single-use, attempt-limited, and time-limited.
- AI prescription routes require authentication, quota controls, strict structured-output validation, sanitized text, encrypted optional sensitive logs, and TTL retention.
- Uploads are checked by magic bytes, image/PDF parsers, decompression limits, and ClamAV in production.
- MongoDB is authenticated and not published outside the Docker network in the production compose file.
- Exact reverse-proxy hop count is mandatory in production.

## Local setup

```bash
npm ci
cp .env.example .env
npm run dev
```

Health and API metadata:

```text
GET /health
GET /api/v1/meta
```

Legacy aliases remain off unless explicitly required for a time-limited migration.

## Production checks

```bash
npm run check
npm run security:check
npm run test:security:integration
npm audit --audit-level=high
```

`npm run test:security:integration` requires `TEST_MONGODB_URI`. The GitHub security workflow starts an isolated MongoDB service and runs the suite automatically.

The CI security gates include:

- syntax and security regression tests;
- MongoDB integration tests with admin, two isolated pharmacists, and a patient;
- CodeQL SAST;
- Gitleaks secret scanning;
- dependency auditing;
- manual OWASP ZAP staging DAST.

An independent penetration test remains a production release gate. See `docs/PENTEST_RELEASE_GATE.md`.

## Deployment

The secure Docker deployment requires MongoDB, Redis, ClamAV, SMTP, and secret files documented in `secrets/README.md`.

```bash
npm ci --omit=dev
npm run privacy:migrate-ai-logs
npm run security:check
npm start
```

Place the backend behind an HTTPS reverse proxy and set `TRUST_PROXY` to the exact number of trusted proxy hops. Never use `TRUST_PROXY=true` in production.

## Documentation

- `docs/API_VERSIONING.md`
- `docs/API.md`
- `docs/FLUTTER_ENDPOINTS.md`
- `docs/DASHBOARD_ENDPOINTS.md`
- `docs/RETAIL_MATGR_ENDPOINTS.md`
- `SECURITY_PHASE2_HARDENING_AR.md`
- `SECURITY_PHASE3_HARDENING_AR.md`
- `docs/PENTEST_RELEASE_GATE.md`
