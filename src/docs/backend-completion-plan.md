# Backend Completion Plan

## Purpose

This document captures the remaining work needed to fully complete the unfinished checklist items for the standalone Express backend repository.

## Current Status Summary

### Already complete

- Standalone Express backend scaffold
- MongoDB connection manager and profile repository
- Profile CRUD and search endpoints
- Deterministic list/search query parsing
- External enrichment integration
- Seed script and validation
- OpenAPI for profile endpoints
- Automated tests for health, profiles, search, validation, and seed behavior

### Still incomplete

- Auth endpoint contract documentation
- Token refresh contract documentation
- CLI CSV export contract documentation
- Full CLI-facing contract coverage
- Minor repository-layer gap: no explicit `countProfiles()` primitive

## Step 1 - Audit And Freeze Missing Contract Scope

### Objective

Close ambiguity before implementing additional docs or backend behavior.

### Status

- Step 1 audit completed
- Step 1 decision freeze completed
- Step 1 contract documentation updates pending in Step 2 and Step 3

### Audit Findings

#### Current documented API surface

Documented today:

- `GET /health`
- `GET /api/v1/profiles`
- `POST /api/v1/profiles`
- `GET /api/v1/profiles/:id`
- `DELETE /api/v1/profiles/:id`
- `GET /api/v1/profiles/search`

Observed in:

- `src/docs/openapi.js`
- `README.md`
- `src/routes/healthRoutes.js`
- `src/routes/profileRoutes.js`

#### Missing contract areas

Not currently documented:

- auth endpoints
- token refresh behavior
- CSV export behavior for CLI consumers

Missing examples:

- auth request and response examples
- refresh token request and response examples
- CSV export request and response examples

#### Existing fixed conventions already in place

These appear stable and should remain consistent with future additions:

- Base path: `/api/v1`
- Error shape:

```json
{
  "status": "error",
  "message": "..."
}
```

- Success shape for profile resources:

```json
{
  "status": "success",
  "data": {}
}
```

### Frozen Decisions

#### 1. Auth endpoint surface

The backend contract will include:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

The backend contract will not include `POST /api/v1/auth/logout` in this phase.

#### 2. Access token format

The backend contract will use:

- bearer tokens returned in JSON payloads
- `access_token` and `refresh_token` field names
- `token_type` set to `Bearer`
- `expires_in` as the access-token TTL in seconds

Token internals are intentionally not frozen at the contract layer beyond the response shape. Clients must treat both tokens as opaque strings.

#### 3. Refresh token transport

The backend contract will use:

- JSON request bodies for refresh requests
- JSON response bodies for refresh responses
- no cookie-based token transport in the initial contract

#### 4. Refresh token lifecycle

The backend contract will use:

- refresh token rotation on every successful refresh
- replacement of both `access_token` and `refresh_token` on successful refresh
- `401 Unauthorized` for invalid or expired refresh tokens
- the standard error response shape for refresh failures

Refresh-token persistence, revocation storage, and exact TTL values remain implementation details until auth runtime work begins.

#### 5. CSV export contract

The backend contract will use:

- `GET /api/v1/profiles/export.csv`
- synchronous download behavior
- the same filter and sort query parameters as `GET /api/v1/profiles`
- no pagination for export responses
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="profiles-export.csv"`
- a fixed CSV column order of `id,name,gender,gender_probability,age,age_group,country_id,country_name,country_probability,created_at`

### Adopted Contract Defaults

These defaults are now adopted for subsequent contract documentation work.

#### Auth

Chosen endpoints:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`

Chosen login response:

```json
{
  "status": "success",
  "data": {
    "access_token": "jwt-or-token",
    "refresh_token": "refresh-token",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

Chosen refresh response:

```json
{
  "status": "success",
  "data": {
    "access_token": "new-jwt-or-token",
    "refresh_token": "new-refresh-token",
    "token_type": "Bearer",
    "expires_in": 900
  }
}
```

Chosen auth failure shape:

```json
{
  "status": "error",
  "message": "Invalid credentials"
}
```

#### Token transport

Chosen default:

- return refresh token in JSON response body
- accept refresh token in JSON request body

Reason:

- simplest contract for both web portal and CLI
- avoids browser-only cookie assumptions

#### CSV export

Chosen endpoint:

- `GET /api/v1/profiles/export.csv`

Chosen behavior:

- accept the same filter and sort parameters as `GET /api/v1/profiles`
- do not paginate exports
- return `text/csv`
- return fixed column order matching the profile contract:
  - `id`
  - `name`
  - `gender`
  - `gender_probability`
  - `age`
  - `age_group`
  - `country_id`
  - `country_name`
  - `country_probability`
  - `created_at`

Chosen headers:

- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="profiles-export.csv"`

### Output Of Step 1

Step 1 is complete because:

- auth endpoints are explicitly chosen
- refresh token transport is chosen
- refresh lifecycle rules are chosen
- CSV export endpoint and behavior are chosen

Follow-up required:

- reflect the frozen auth decisions in `src/docs/openapi.js` and `README.md`
- reflect the frozen CSV export decisions in `src/docs/openapi.js` and `README.md`

## Remaining Execution Steps

### Step 2 - Document auth contract

Add auth endpoints, schemas, and examples to:

- `src/docs/openapi.js`
- `README.md`

Suggested commit:

- `docs: define auth contract and token refresh behavior`

### Step 3 - Document CLI CSV export contract

Add export endpoint docs, CSV sample, and CLI usage notes.

Suggested commit:

- `docs: define cli csv export contract`

### Step 4 - Close minor repository primitive gap

Add explicit repository methods such as:

- `countProfiles(filter)`
- optional `findMany(filter, sort, skip, limit)`

Suggested commit:

- `refactor: expose explicit profile count and list repository primitives`

### Step 5 - Expand endpoint examples

Add complete examples for:

- list
- get by id
- search
- create
- auth
- export

Suggested commit:

- `docs: expand api examples for frontend and cli`

### Step 6 - Final consistency pass

Verify:

- OpenAPI matches README
- CLI-facing endpoints are fully documented
- error shapes are consistent
- auth and export semantics are unambiguous

Suggested commit:

- `docs: align api contract examples and error semantics`
