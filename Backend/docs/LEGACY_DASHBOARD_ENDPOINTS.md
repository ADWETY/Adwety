# Retired dashboard compatibility endpoints

The original dashboard compatibility router is disabled by default and is not part of the production API surface.

Canonical replacement:

```text
/api/v1/admin
```

Temporary migration-only activation:

```env
ENABLE_LEGACY_DASHBOARD_ROUTES=true
```

When enabled, compatibility responses carry `Deprecation`, `Sunset`, `Link`, and `Warning` headers and use the same centralized authentication, authorization, MFA, validation, tenant-boundary, and Redis rate-limit middleware. Disable the flag immediately after the dashboard is migrated.

Do not implement new features in `legacy-dashboard.controller.js`. New features belong in the canonical modular controllers under `/api/v1` or `/api/v1/admin`.
