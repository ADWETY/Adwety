# Security Remediation - May 24, 2026 Assessment

This backend version implements and verifies all six requirements in the Adwety Security Assessment report.

## Implemented fixes

1. **Mass assignment in public registration**
   - Public registration schemas use strict allowlists and reject unknown fields such as `role`.
   - `/api/auth/register`, `/v1/register`, `/v1/auth/register`, and the legacy `/api/v1/auth/register` compatibility route all enforce the same restriction.
   - New public registrations are always created as the low-privilege `patient` role.

2. **BOLA / IDOR on global drug updates**
   - `PUT /api/drugs/:id` is restricted to `admin` at route middleware and controller levels.
   - Legacy `/api/v1/medicines/:id` write routes now also use explicit admin RBAC middleware, in addition to controller guards.

3. **PII leakage from public pharmacy listing**
   - `GET /api/pharmacies` uses an explicit database projection and public serializer.
   - It does not return `owner_id`, email, creation/update audit fields, or internal ownership relationships.
   - Public callers cannot enumerate pending, rejected, or inactive pharmacies through a `status` query parameter.

4. **Unauthorized global drug creation**
   - `POST /api/drugs` is restricted to `admin` at route and controller levels.
   - Legacy global medicine creation is also restricted through explicit admin RBAC middleware.
   - Pharmacists can only reference active master drugs through inventory synchronization.

5. **Drug state sync visibility defect**
   - Global drug creation and update explicitly preserve `isActive: true`.
   - `GET /api/drugs` returns all records where `isActive` is not false.
   - Inventory synchronization refuses inactive/nonexistent master drugs.

6. **Secure pharmacist-specific inventory**
   - `GET /api/pharmacy/my-inventory` is pharmacist-only.
   - The tenant boundary is derived exclusively from the authenticated JWT user and does not accept `pharmacyId` in query, params, or body.
   - For `POST /api/inventory/sync`, pharmacist tenant selection is also derived from the authenticated account. Any mismatched submitted pharmacy ID is rejected. Admins retain the explicit pharmacy ID workflow.

## Verification

Run:

```bash
npm run check
npm run security:check
```

A live integration test still requires a configured MongoDB instance.
