# Profile Intelligence API

Standalone Express.js backend for profile enrichment, storage, filtering, and deterministic natural-language search. This repository is backend-only and is designed to replace a Next.js API layer while serving both a web portal and a future CLI.

## Stack

- Node.js 22.x
- Express.js with ESM
- MongoDB native driver
- `uuidv7`
- `dotenv`
- `cors`
- `helmet`
- `morgan`
- `zod`
- `vitest`
- `supertest`
- Swagger UI at `/docs`

## Folder Structure

```text
.
├── .env.example
├── .gitignore
├── Dockerfile
├── README.md
├── docker-compose.yml
├── package.json
├── scripts
│   ├── build.js
│   └── seed.js
├── src
│   ├── app.js
│   ├── config
│   │   ├── cors.js
│   │   └── env.js
│   ├── constants
│   │   └── profile.js
│   ├── controllers
│   │   ├── healthController.js
│   │   └── profileController.js
│   ├── db
│   │   └── mongo.js
│   ├── docs
│   │   └── openapi.js
│   ├── middleware
│   │   ├── errorHandler.js
│   │   └── notFound.js
│   ├── repositories
│   │   └── profileRepository.js
│   ├── routes
│   │   ├── healthRoutes.js
│   │   └── profileRoutes.js
│   ├── server.js
│   ├── services
│   │   ├── enrichmentService.js
│   │   ├── profileService.js
│   │   ├── searchService.js
│   │   └── seedService.js
│   ├── utils
│   │   ├── appError.js
│   │   ├── asyncHandler.js
│   │   ├── country.js
│   │   ├── date.js
│   │   ├── normalization.js
│   │   └── pagination.js
│   └── validators
│       ├── profileValidators.js
│       ├── queryValidators.js
│       └── seedValidator.js
├── tests
│   ├── health.test.js
│   ├── helpers
│   │   └── mockFetch.js
│   ├── profiles.create.test.js
│   ├── profiles.list-search.test.js
│   ├── profiles.read-delete.test.js
│   ├── seed.test.js
│   └── setup.js
└── vitest.config.js
```

## Environment Variables

Copy `.env.example` to `.env` and update as needed.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `4000` | API port |
| `NODE_ENV` | No | `development` | Runtime environment |
| `MONGO_URI` | No | `mongodb://127.0.0.1:27017` | MongoDB connection URI |
| `DB_NAME` | No | `profile_db` | MongoDB database name |
| `CORS_ORIGIN` | No | `*` | Allowed origins. `*` enables all origins |
| `SEED_PROFILES_SOURCE` | No | provided Google Drive download URL | Seed dataset source |
| `APP_BASE_URL` | No | `http://localhost:4000` | Base URL used to derive default OAuth callback URLs |
| `GITHUB_CLIENT_ID` | Yes for GitHub OAuth | none | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Yes for GitHub OAuth callback | none | GitHub OAuth app client secret |
| `GITHUB_SCOPE` | No | `read:user user:email` | Scope sent to GitHub during OAuth authorization |
| `GITHUB_AUTHORIZE_URL` | No | GitHub authorize URL | Override for the GitHub OAuth authorize endpoint |
| `GITHUB_TOKEN_URL` | No | GitHub token URL | Override for the GitHub OAuth token exchange endpoint |
| `GITHUB_REDIRECT_URI` | No | `APP_BASE_URL + /auth/github/callback` | Callback URI registered with the GitHub OAuth app |
| `GITHUB_USER_URL` | No | GitHub user API URL | Override for the GitHub user lookup endpoint |
| `GITHUB_USER_EMAILS_URL` | No | GitHub user emails API URL | Override for the GitHub user email lookup endpoint |
| `AUTH_COOKIE_SECURE` | No | `true` in production, otherwise `false` | Marks OAuth PKCE cookies as secure-only |
| `AUTH_PKCE_COOKIE_MAX_AGE_MS` | No | `600000` | Max age for PKCE verifier and state cookies |
| `ACCESS_TOKEN_SECRET` | Yes for app auth | none | HMAC secret used to sign access tokens |
| `REFRESH_TOKEN_SECRET` | Yes for app auth | none | HMAC secret used to sign refresh tokens |
| `ACCESS_TOKEN_TTL_SECONDS` | No | `180` | Access token lifetime in seconds |
| `REFRESH_TOKEN_TTL_SECONDS` | No | `300` | Refresh token lifetime in seconds |
| `ENABLE_DOCS` | No | `true` outside production, `false` in production | Expose Swagger UI at `/docs` |
| `TRUST_PROXY` | No | `true` in production, otherwise `false` | Trust reverse-proxy headers for IPs and rate limiting |
| `RATE_LIMIT_ENABLED` | No | `true` outside test | Enable in-memory request rate limiting |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate-limit window length |
| `AUTH_RATE_LIMIT_MAX_REQUESTS` | No | `10` | Max requests per IP per window for `/auth/*` |
| `RATE_LIMIT_MAX_REQUESTS` | No | `60` | Max requests per IP per window for all non-auth endpoints |
| `REQUEST_TIMEOUT_MS` | No | `15000` | Per-request timeout on the Node HTTP server |
| `HEADERS_TIMEOUT_MS` | No | `16000` | Header-read timeout on the Node HTTP server |
| `KEEP_ALIVE_TIMEOUT_MS` | No | `5000` | Keep-alive timeout on the Node HTTP server |
| `SHUTDOWN_TIMEOUT_MS` | No | `10000` | Forced shutdown timeout after `SIGINT` or `SIGTERM` |
| `MONGO_SERVER_SELECTION_TIMEOUT_MS` | No | `5000` | MongoDB server selection timeout |
| `MONGO_MAX_POOL_SIZE` | No | `20` | MongoDB max connection pool size |
| `MONGO_MIN_POOL_SIZE` | No | `0` | MongoDB min connection pool size |

## Setup

```bash
npm install
cp .env.example .env
```

## Run Locally

Start MongoDB first, then run:

```bash
npm run dev
```

Production start:

```bash
npm start
```

Build validation:

```bash
npm run build
```

## Docker

```bash
docker compose up --build
```

The API will be available at `http://localhost:4000`.

## Database Behavior

- Database name defaults to `profile_db`
- Collection name is `profiles`
- Indexes are created automatically on startup
- Unique indexes exist on `name` and `id`
- Seed upserts preserve existing `id` and `created_at`

## API Routes

### `GET /health`

Returns service health and database readiness.

Example response:

```json
{
  "status": "success",
  "data": {
    "environment": "development",
    "database": "ready"
  }
}
```

### `GET /health/ready`

Returns readiness for deployment probes. This endpoint returns `200` only when the database dependency is ready, and returns `503` when the API should be considered not ready for traffic.

### Auth routes

### `GET /auth/github`

Starts the GitHub OAuth flow with PKCE.

Behavior:

- Returns `302 Found` to the GitHub authorize URL
- Sets HTTP-only `github_oauth_state` and `github_oauth_code_verifier` cookies scoped to `/auth/github`
- Returns `Cache-Control: no-store`
- Returns `500` with `GitHub OAuth is not configured` when `GITHUB_CLIENT_ID` is missing

### `GET /auth/github/callback`

Handles the GitHub OAuth callback and issues application tokens.

Success response:

```json
{
  "status": "success",
  "access_token": "token",
  "refresh_token": "token"
}
```

Behavior:

- Validates the GitHub `code` and `state` query parameters
- Validates the PKCE state and verifier cookies
- Exchanges the GitHub code for a GitHub access token
- Creates a new user with role `analyst` when the GitHub account is seen for the first time
- Reuses existing users, preserving their `role` and `is_active` values
- Updates `last_login_at` on successful login
- Clears the temporary PKCE cookies
- Returns `Cache-Control: no-store`

Common failure responses:

```json
{
  "status": "error",
  "message": "Invalid GitHub OAuth state"
}
```

```json
{
  "status": "error",
  "message": "GitHub OAuth exchange failed"
}
```

### `POST /auth/refresh`

Rotates both the access token and the refresh token through a JSON request body.

Request:

```json
{
  "refresh_token": "token"
}
```

Success response:

```json
{
  "status": "success",
  "access_token": "token",
  "refresh_token": "token"
}
```

Behavior:

- Accepts refresh tokens in a JSON request body
- Rotates both `access_token` and `refresh_token` after a successful refresh
- Invalidates the previously submitted refresh token immediately
- Returns `401 Unauthorized` for invalid or expired refresh tokens

Common failure responses:

```json
{
  "status": "error",
  "message": "Refresh token is required"
}
```

```json
{
  "status": "error",
  "message": "Invalid or expired refresh token"
}
```

### `POST /auth/logout`

Invalidates the submitted refresh token.

Request:

```json
{
  "refresh_token": "token"
}
```

Behavior:

- Deletes the matching stored refresh token
- Returns `204 No Content` on success
- Returns `401 Unauthorized` if the refresh token is invalid or already expired

## Protected API contract

All `/api/*` routes require:

- `Authorization: Bearer <access_token>`
- an active user account

All profile routes also require:

- `X-API-Version: 1`

Role access:

- `admin`: list, search, read, export, create, delete
- `analyst`: list, search, read, export

Common auth and access failures:

```json
{
  "status": "error",
  "message": "Authentication required"
}
```

```json
{
  "status": "error",
  "message": "User account is inactive"
}
```

```json
{
  "status": "error",
  "message": "API version header required"
}
```

### `POST /api/v1/profiles`

Create or idempotently reuse a profile. This route requires an `admin` access token and `X-API-Version: 1`.

Request:

```json
{
  "name": "ella"
}
```

New profile response:

```json
{
  "status": "success",
  "data": {
    "id": "018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.98,
    "age": 28,
    "age_group": "adult",
    "country_id": "NG",
    "country_name": "Nigeria",
    "country_probability": 0.64,
    "created_at": "2026-04-15T08:00:00Z"
  }
}
```

Existing profile response:

```json
{
  "status": "success",
  "data": {
    "id": "018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.98,
    "age": 28,
    "age_group": "adult",
    "country_id": "NG",
    "country_name": "Nigeria",
    "country_probability": 0.64,
    "created_at": "2026-04-15T08:00:00Z"
  },
  "message": "Profile already exists"
}
```

### `GET /api/v1/profiles`

Supports:

- Filters: `gender`, `age_group`, `country_id`, `min_age`, `max_age`, `min_gender_probability`, `min_country_probability`
- Sorting: `sort_by=age|created_at|gender_probability`, `order=asc|desc`
- Pagination: `page`, `limit` with limit clamped to `50`
- Validation: semantic query errors return `400`, while invalid numeric formats such as `min_age=abc` return `422`
- Requires `Authorization: Bearer <access_token>` and `X-API-Version: 1`
- Read access is allowed for `admin` and `analyst`

Example:

```bash
curl \
  -H "Authorization: Bearer <access_token>" \
  -H "X-API-Version: 1" \
  "http://localhost:4000/api/v1/profiles?gender=female&sort_by=age&order=desc&page=1&limit=10"
```

Example response:

```json
{
  "status": "success",
  "page": 1,
  "limit": 2,
  "total": 2,
  "total_pages": 1,
  "links": {
    "self": "/api/v1/profiles?gender=female&sort_by=age&order=desc&page=1&limit=2",
    "next": null,
    "prev": null
  },
  "data": [
    {
      "id": "018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7c",
      "name": "martha",
      "gender": "female",
      "gender_probability": 0.9,
      "age": 67,
      "age_group": "senior",
      "country_id": "GB",
      "country_name": "United Kingdom",
      "country_probability": 0.83,
      "created_at": "2026-04-17T08:00:00Z"
    },
    {
      "id": "018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a",
      "name": "ella",
      "gender": "female",
      "gender_probability": 0.98,
      "age": 28,
      "age_group": "adult",
      "country_id": "NG",
      "country_name": "Nigeria",
      "country_probability": 0.64,
      "created_at": "2026-04-15T08:00:00Z"
    }
  ]
}
```

### `GET /api/v1/profiles/export?format=csv`

Exports matching profiles as CSV. This route requires `Authorization: Bearer <access_token>` and `X-API-Version: 1`. Read access is allowed for `admin` and `analyst`.

Behavior:

- Uses the same filter and sort query parameters as `GET /api/v1/profiles`
- Requires `format=csv`
- Does not paginate export responses
- Returns `Content-Type: text/csv; charset=utf-8`
- Returns `Content-Disposition: attachment; filename="profiles_<timestamp>.csv"`
- Uses the same query validation rules as `GET /api/v1/profiles`, including `400` semantic validation errors and `422` invalid numeric formats

CSV column order:

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

Example:

```bash
curl -L \
  -H "Authorization: Bearer <access_token>" \
  -H "X-API-Version: 1" \
  "http://localhost:4000/api/v1/profiles/export?format=csv&gender=female&sort_by=age&order=desc" \
  -o profiles.csv
```

Illustrative CSV response:

```csv
id,name,gender,gender_probability,age,age_group,country_id,country_name,country_probability,created_at
018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a,ella,female,0.98,28,adult,NG,Nigeria,0.64,2026-04-15T08:00:00Z
018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7c,martha,female,0.9,67,senior,GB,United Kingdom,0.83,2026-04-17T08:00:00Z
```

### `GET /api/v1/profiles/search?q=...`

Deterministic natural-language search rules:

- Gender words: `male`, `males`, `female`, `females`
- Age groups: `child`, `children`, `teenager`, `teenagers`, `adult`, `adults`, `senior`, `seniors`
- Special token: `young` maps to ages `16` through `24`
- Comparators: `above 30`, `over 30`, `older than 30`, `below 20`, `under 20`, `younger than 20`
- Country phrases: `from nigeria`, `from united kingdom`
- Filter, sort, and pagination parameters follow the same validation rules as `GET /api/v1/profiles`
- Requires `Authorization: Bearer <access_token>` and `X-API-Version: 1`
- Read access is allowed for `admin` and `analyst`

Example:

```bash
curl \
  -H "Authorization: Bearer <access_token>" \
  -H "X-API-Version: 1" \
  "http://localhost:4000/api/v1/profiles/search?q=older%20than%2030%20from%20united%20kingdom"
```

Example response:

```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 1,
  "total_pages": 1,
  "links": {
    "self": "/api/v1/profiles/search?q=older+than+30+from+united+kingdom&page=1&limit=10",
    "next": null,
    "prev": null
  },
  "data": [
    {
      "id": "018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7c",
      "name": "martha",
      "gender": "female",
      "gender_probability": 0.9,
      "age": 67,
      "age_group": "senior",
      "country_id": "GB",
      "country_name": "United Kingdom",
      "country_probability": 0.83,
      "created_at": "2026-04-17T08:00:00Z"
    }
  ]
}
```

If the query cannot be interpreted:

```json
{
  "status": "error",
  "message": "Unable to interpret query"
}
```

### `GET /api/v1/profiles/:id`

Fetch one profile by id. This route requires `Authorization: Bearer <access_token>` and `X-API-Version: 1`. Read access is allowed for `admin` and `analyst`.

Example response:

```json
{
  "status": "success",
  "data": {
    "id": "018f4f5c-6a90-7a33-b9d8-3c4f0e8b9f7a",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.98,
    "age": 28,
    "age_group": "adult",
    "country_id": "NG",
    "country_name": "Nigeria",
    "country_probability": 0.64,
    "created_at": "2026-04-15T08:00:00Z"
  }
}
```

### `DELETE /api/v1/profiles/:id`

Delete one profile by id. This route requires an `admin` access token and `X-API-Version: 1`. Returns `204 No Content` on success.

## Error Contract

All API errors use:

```json
{
  "status": "error",
  "message": "..."
}
```

Common error messages returned by the current backend:

- `Authentication required`
- `User account is inactive`
- `Forbidden`
- `API version header required`
- `GitHub OAuth is not configured`
- `GitHub OAuth is not fully configured`
- `GitHub OAuth code is required`
- `GitHub OAuth state is required`
- `Invalid GitHub OAuth state`
- `GitHub OAuth verifier is missing`
- `GitHub OAuth exchange failed`
- `Refresh token is required`
- `Refresh token must be a string`
- `Invalid or expired refresh token`
- `Invalid query parameters`
- `Unable to interpret query`
- `Database error`
- `Internal server error`
- `Profile not found`
- `Invalid JSON body`
- `Name is required`
- `Name must be a string`
- `Too many requests`
- `Upstream enrichment service failed`

## Operational Behavior

- CORS allows all origins by default
- Rate limiting returns `429 Too Many Requests`
- `/auth/*` is limited to `10` requests per minute per client IP
- All other endpoints are limited to `60` requests per minute per client IP
- Every non-test request is logged with method, endpoint, status code, and response time

Common non-error success message:

- `Profile already exists`

## Seed Data

Run:

```bash
npm run seed
```

Behavior:

- Loads JSON from `SEED_PROFILES_SOURCE`
- Validates exact top-level shape `{ "profiles": [...] }`
- Validates exact profile keys
- Rejects duplicate normalized names in the payload
- Upserts by normalized `name`
- Preserves existing `id` and `created_at`
- Prints processed, matched, modified, and upserted counts

## Testing

Run all tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Test notes:

- Uses `mongodb-memory-server` for isolated MongoDB integration tests
- Uses mocked `fetch` for upstream enrichment APIs
- Covers GitHub OAuth redirect and callback handling, refresh/logout session lifecycle, role-based access control, version-header enforcement, CSV export, create, idempotent create, get by id, delete, list filters, search interpretation, validation, and seed behavior

## Frontend Integration

The separate frontend should call this API through the versioned base path:

```text
http://<api-host>/api/v1
```

Recommended frontend usage:

- Start OAuth: `GET /auth/github`
- Handle OAuth callback response from `GET /auth/github/callback`
- Rotate sessions: `POST /auth/refresh`
- End sessions: `POST /auth/logout`
- Portal create flow: `POST /api/v1/profiles`
- Portal list pages: `GET /api/v1/profiles`
- CLI export flow: `GET /api/v1/profiles/export?format=csv`
- Portal search box: `GET /api/v1/profiles/search?q=...`
- CLI integration: same endpoints using JSON over HTTP

Every profile request should send:

- `Authorization: Bearer <access_token>`
- `X-API-Version: 1`

The default CORS policy allows requests from all origins. Set `CORS_ORIGIN` to `*` to keep that behavior, or provide a comma-separated list if you later want to restrict it.

## Deployment Notes

- Set `NODE_ENV=production`
- Provide a production MongoDB URI through `MONGO_URI`
- Keep `CORS_ORIGIN=*` to allow all origins, or provide a comma-separated list if you want to restrict access later
- Set `TRUST_PROXY=true` when running behind a load balancer or ingress proxy
- Decide whether Swagger should be public; keep `ENABLE_DOCS=false` in production unless you need external docs access
- Tune `AUTH_RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MS`, and `RATE_LIMIT_MAX_REQUESTS` for your expected traffic profile
- Run the service behind a reverse proxy or load balancer if needed
- Use the `/health` endpoint for readiness checks
- Use `/health/ready` for readiness probes and `/health` for liveness or diagnostics
- API documentation is exposed at `/docs` only when `ENABLE_DOCS=true`
