# API versioning and route retirement

## Official routes

There is one official public version:

- Core and dashboard API: `/api/v1`
- Mobile response adapter: `/api/v1/mobile`
- Administration modules: `/api/v1/admin`

New business logic, validation, authorization, and tests must be added to these canonical routers only.

## Retired and migration-only routes

The following are disabled by default:

- `/api/*` historical alias;
- `/v1/*` historical mobile alias;
- `/api/v1/dashboard/*` administration alias;
- original dashboard compatibility endpoints implemented by `legacy-dashboard.routes.js`.

When one is temporarily enabled, it delegates to a canonical router where possible, uses the same security middleware and Redis buckets, and returns:

- `Deprecation: true`;
- `Sunset: <configured date>`;
- `Link: <successor>; rel="successor-version"`;
- HTTP `410 Gone` after it is disabled.

Production defaults and `docker-compose.yml` keep all aliases disabled.

## Migration flags

```env
ENABLE_API_ALIAS=false
ENABLE_MOBILE_V1_ALIAS=false
ENABLE_LEGACY_DASHBOARD_ROUTES=false
ENABLE_DASHBOARD_ALIAS=false
API_SUNSET_AT=2026-12-31T23:59:59Z
```

An exception must have an owner and removal date. Do not enable an alias to add a new feature; migrate the client to the canonical route instead.

## Mapping

| Historical | Canonical successor |
|---|---|
| `/api/auth/*` | `/api/v1/auth/*` |
| `/api/admin/*` | `/api/v1/admin/*` |
| `/api/dashboard/*` | `/api/v1/admin/*` |
| `/api/v1/dashboard/*` | `/api/v1/admin/*` |
| `/v1/*` | `/api/v1/mobile/*` |

## Controller policy

`routes/flutter.routes.js` and `controllers/flutter.controller.js` are compatibility exports only. They re-export the modular canonical implementations and contain no separate business logic. Legacy dashboard code is migration-only and is not mounted unless explicitly enabled.
