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
| `CORS_ORIGIN` | No | local portal origins | Comma-separated allowed origins |
| `SEED_PROFILES_SOURCE` | No | provided Google Drive download URL | Seed dataset source |

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

### `POST /api/v1/profiles`

Create or idempotently reuse a profile.

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

Example:

```bash
curl "http://localhost:4000/api/v1/profiles?gender=female&sort_by=age&order=desc&page=1&limit=10"
```

### `GET /api/v1/profiles/search?q=...`

Deterministic natural-language search rules:

- Gender words: `male`, `males`, `female`, `females`
- Age groups: `child`, `children`, `teenager`, `teenagers`, `adult`, `adults`, `senior`, `seniors`
- Special token: `young` maps to ages `16` through `24`
- Comparators: `above 30`, `over 30`, `older than 30`, `below 20`, `under 20`, `younger than 20`
- Country phrases: `from nigeria`, `from united kingdom`

Example:

```bash
curl "http://localhost:4000/api/v1/profiles/search?q=older%20than%2030%20from%20united%20kingdom"
```

If the query cannot be interpreted:

```json
{
  "status": "error",
  "message": "Unable to interpret query"
}
```

### `GET /api/v1/profiles/:id`

Fetch one profile by id.

### `DELETE /api/v1/profiles/:id`

Delete one profile by id. Returns `204 No Content` on success.

## Error Contract

All API errors use:

```json
{
  "status": "error",
  "message": "..."
}
```

Common messages preserved by the implementation:

- `Invalid query parameters`
- `Unable to interpret query`
- `Database error`
- `Profile already exists`
- `Profile not found`
- `Invalid JSON body`
- `Name is required`
- `Name must be a string`
- `Profile id is required`
- `Profile id must be a string`

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
- Covers health, create, idempotent create, get by id, delete, list filters, search interpretation, validation, and seed behavior

## Frontend Integration

The separate frontend should call this API through the versioned base path:

```text
http://<api-host>/api/v1
```

Recommended frontend usage:

- Portal create flow: `POST /api/v1/profiles`
- Portal list pages: `GET /api/v1/profiles`
- Portal search box: `GET /api/v1/profiles/search?q=...`
- CLI integration: same endpoints using JSON over HTTP

Configure the frontend origin in `CORS_ORIGIN` as a comma-separated list when deploying across separate repos or environments.

## Deployment Notes

- Set `NODE_ENV=production`
- Provide a production MongoDB URI through `MONGO_URI`
- Restrict `CORS_ORIGIN` to trusted portal origins
- Run the service behind a reverse proxy or load balancer if needed
- Use the `/health` endpoint for readiness checks
- API documentation is exposed at `/docs`
