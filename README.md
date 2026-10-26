# Order Management System (Advanced)

A production-grade NestJS REST API for order processing, inventory management, user authentication, role-based access control, and sales analytics. Backed by PostgreSQL with PgBouncer connection pooling, TypeORM, and BullMQ.

---

## Architecture Overview

- **Framework:** NestJS (Node.js 24+, Express)
- **Database:** PostgreSQL with TypeORM migrations
- **Connection Pooler:** PgBouncer in Docker (transaction pooling mode)
- **Queues:** BullMQ with Redis (asynchronous audit event processing)
- **Documentation:** Swagger OpenAPI at `/api/docs`
- **Testing:** Vitest & Supertest (unit & end-to-end)

---

## Project Setup & Installation

### Prerequisites
- Node.js `v20+` or `v24+`
- Docker and Docker Compose
- PostgreSQL 14+ running locally or remotely (default port `5432`)
- Redis running locally or remotely (default port `6379`)

### Installation Steps

1. **Clone and install dependencies:**
   ```bash
   git clone <repo-url>
   cd order_management
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials, JWT secrets, and system user ID.

3. **Start PgBouncer pooler:**
   ```bash
   docker compose up -d pgbouncer
   ```

4. **Run database migrations:**
   ```bash
   npm run migration:run
   ```

5. **Seed initial admin user:**
   ```bash
   npm run seed:admin
   ```

6. **Start the application:**
   ```bash
   # Development (watch mode)
   npm run start:dev

   # Production build
   npm run build
   npm run start:prod
   ```

---

## Environment Variables

Refer to [.env.example](file:///a:/NestJS/Order_management_system%20-%20Advanced/order_management/.env.example) for all variables and recommended defaults. Never commit real credentials to version control.

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Application HTTP port | `3000` |
| `DB_HOST` | Hostname for PostgreSQL / PgBouncer | `localhost` |
| `DB_PORT` | Port for database connections (connect to PgBouncer) | `6432` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database user password | *secret* |
| `DB_NAME` | Database name | `order_management_system_advanced` |
| `DB_POOL_MAX` | TypeORM / pg driver pool size | `10` |
| `DB_IDLE_TIMEOUT_MS` | Inactive connection close timeout (ms) | `30000` |
| `DB_CONNECTION_TIMEOUT_MS` | Connection establishment timeout (ms) | `5000` |
| `DB_STATEMENT_TIMEOUT_MS` | SQL query execution timeout (ms) | `5000` |
| `PGBOUNCER_HOST_PORT` | Port exposed by PgBouncer container | `6432` |
| `PGBOUNCER_POOL_SIZE` | Max server connections managed by PgBouncer | `20` |
| `JWT_ACCESS_SECRET` | Secret key for signing JWT access tokens | *64-char hex* |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | *64-char hex* |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `1d` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `AUTO_CANCEL_SYSTEM_USER_ID` | UUID of system user for stock restoration in auto-cancel cron | UUID |
| `REDIS_HOST` | Redis host for BullMQ queues | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |

---

## Available Scripts

All scripts match the definitions in `package.json`:

```bash
# Application Lifecycle
npm run start           # Start NestJS application
npm run start:dev       # Start with file watcher (hot reload)
npm run build           # Compile TypeScript to dist/
npm run start:prod      # Run compiled build with Node

# Database Migrations (TypeORM CLI via dist/database/data-source.js)
npm run migration:show      # List all applied and pending migrations
npm run migration:run       # Apply pending migrations
npm run migration:revert    # Revert the latest migration
npm run migration:generate  # Generate a migration based on entity changes

# Database Seeding
npm run seed:admin      # Seed default admin user (admin@gmail.com / Admin@123)

# Testing & Quality
npm run test            # Run unit tests via Vitest
npm run test:watch      # Run unit tests in watch mode
npm run test:cov        # Run test coverage analysis
npm run test:e2e        # Run end-to-end integration tests
npm run lint            # Run Oxlint linter
npm run format          # Run Prettier code formatting
```

---

## Docker & PgBouncer Setup

The project uses PgBouncer (`edoburu/pgbouncer:latest`) to pool PostgreSQL connections in `transaction` mode.

### Services Architecture
```
[ NestJS Application ] (Pool max: 10 connections)
         │
         ▼ Port 6432
[ PgBouncer Container ] (Pool size: 20 connections, transaction mode)
         │
         ▼ Port 5432
[ PostgreSQL Database ]
```

### Docker Commands

```bash
# Start PgBouncer in detached mode
docker compose up -d pgbouncer

# Stop PgBouncer container
docker compose down

# Check container health and status
docker ps --filter "name=pgbouncer"

# Inspect live container logs
docker compose logs -f pgbouncer
```

### Verification
Verify connectivity through PgBouncer:
```bash
# Test connection via TypeORM migration check
npm run migration:show

# Or test via psql CLI
psql -h localhost -p 6432 -U postgres -d order_management_system_advanced
```

---

## Database Indexes & Optimization Rationale

The database schema utilizes 10 strategic indexes and constraints to maximize performance across critical queries:

| Table | Index Name | Columns / Expressions | Optimization Rationale |
| :--- | :--- | :--- | :--- |
| `auth.users` | `PK_users` / `UQ_email` | `id` (PK), `email` (UQ) | Fast O(1) user lookup during login; prevents duplicate email registrations. |
| `order_management.orders` | `idx_orders_status_createdAt` | `(status, created_at)` | Accelerates order filtering by status (`PENDING`, `COMPLETED`) and ordering by time. Critical for the stale-order auto-cancellation cron. |
| `order_management.orders` | `idx_orders_user_created_at` | `(user_id, created_at)` | Composite index serving customer order history (`GET /orders`). Filters by user and sorts latest orders first. |
| `order_management.orders` | `UQ_orders_user_idempotency` | `(user_id, idempotency_key)` | Unique constraint enforcing idempotency per user. Prevents duplicate charges and race conditions. |
| `order_management.order_items` | `idx_order_items_order_id` | `order_id` | Foreign key index. Eliminates sequential scans when fetching line items for an order. |
| `order_management.order_items` | `idx_order_items_product_id` | `product_id` | Speeds up aggregate reports (top selling products) and integrity checks. |
| `order_management.products` | `idx_products_category_id` | `category_id` | Accelerates product catalog filtering by category. |
| `order_management.products` | `idx_products_name_trgm` | `name` | Supports fast text search and ILIKE matching on product names. |
| `order_management.order_status_history` | `idx_order_status_history_order_id` | `order_id` | Fast chronological retrieval of order status changes for audit logs (`GET /orders/:id/history`). |
| `order_management.audit_logs` | `IDX_entity_type_id` / `IDX_user_created` | `(entity_type, entity_id)`, `(user_id, created_at)` | Fast audit trail retrieval by entity or user activity timeline. |

---

## Timezone Approach

1. **Storage (UTC / Timestamptz):**
   All timestamp columns (`created_at`, `updated_at`, `deleted_at`, `expires_at`, `revoked_at`) are declared as `timestamptz` (`TIMESTAMP WITH TIME ZONE`). PostgreSQL stores them internally in UTC format.

2. **Reporting Boundaries (Asia/Kolkata):**
   Business reports aggregate sales and revenue using explicit timezone conversion:
   ```sql
   (o.created_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN $1::date AND $2::date
   ```
   This ensures that daily aggregations align with Indian Standard Time (IST, UTC+05:30) business days, preventing orders placed between 18:30 and 23:59 UTC from shifting into the wrong calendar date.

3. **Order Number Generation:**
   Order identifiers prefix today's date using the database calendar:
   ```sql
   'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_management.order_number_seq')::TEXT, 6, '0')
   ```

---

## Query Execution Plans (EXPLAIN ANALYZE)

The following execution plans were measured directly against the development PostgreSQL database through PgBouncer on port `6432`.

### 1. Filter Orders by Status & Sort by CreatedAt
```sql
EXPLAIN ANALYZE
SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at
FROM "order_management"."orders" o
WHERE o.status = 'PENDING'
ORDER BY o.created_at DESC
LIMIT 10;
```
**Actual Output:**
```
Limit  (cost=0.15..8.17 rows=1 width=162) (actual time=0.009..0.009 rows=0 loops=1)
  ->  Index Scan Backward using "idx_orders_status_createdAt" on orders o  (cost=0.15..8.17 rows=1 width=162) (actual time=0.007..0.007 rows=0 loops=1)
        Index Cond: (status = 'PENDING'::order_management.order_status_enum)
Planning Time: 4.056 ms
Execution Time: 0.029 ms
```
*Plan Explanation:* Uses `Index Scan Backward` on the composite index `idx_orders_status_createdAt`. The index condition directly selects pending orders and scans in reverse order without requiring an in-memory sort node.

### 2. Filter Orders by User ID & Sort by CreatedAt
```sql
EXPLAIN ANALYZE
SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at
FROM "order_management"."orders" o
WHERE o.user_id = '6d3910aa-7b85-46dc-a404-bde9feaf2b98'
ORDER BY o.created_at DESC
LIMIT 10;
```
**Actual Output:**
```
Limit  (cost=0.15..8.17 rows=1 width=162) (actual time=0.359..0.360 rows=0 loops=1)
  ->  Index Scan Backward using idx_orders_user_created_at on orders o  (cost=0.15..8.17 rows=1 width=162) (actual time=0.358..0.358 rows=0 loops=1)
        Index Cond: (user_id = '6d3910aa-7b85-46dc-a404-bde9feaf2b98'::uuid)
Planning Time: 0.112 ms
Execution Time: 0.371 ms
```
*Plan Explanation:* Directly leverages `idx_orders_user_created_at` in reverse order. Returns customer orders efficiently without table scanning or sorting.

### 3. Fetch Order Items by Order ID
```sql
EXPLAIN ANALYZE
SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price, oi.line_total
FROM "order_management"."order_items" oi
WHERE oi.order_id = '00000000-0000-0000-0000-000000000000'::uuid;
```
**Actual Output:**
```
Bitmap Heap Scan on order_items oi  (cost=4.18..12.64 rows=4 width=84) (actual time=0.221..0.221 rows=0 loops=1)
  Recheck Cond: (order_id = '00000000-0000-0000-0000-000000000000'::uuid)
  ->  Bitmap Index Scan on idx_order_items_order_id  (cost=0.00..4.18 rows=4 width=0) (actual time=0.017..0.017 rows=0 loops=1)
        Index Cond: (order_id = '00000000-0000-0000-0000-000000000000'::uuid)
Planning Time: 2.761 ms
Execution Time: 0.236 ms
```
*Plan Explanation:* Foreign key index scan via `idx_order_items_order_id` retrieves all child line items for a parent order in 0.236 ms.

### 4. Stale Orders Selection for Auto-Cancellation
```sql
EXPLAIN ANALYZE
SELECT o.id, o.status, o.created_at
FROM "order_management"."orders" o
WHERE o.status = 'PENDING'
  AND o.created_at <= NOW() - INTERVAL '30 minutes'
ORDER BY o.created_at ASC, o.id ASC
LIMIT 50;
```
**Actual Output:**
```
Limit  (cost=8.18..8.23 rows=2 width=28) (actual time=0.020..0.021 rows=0 loops=1)
  ->  Incremental Sort  (cost=8.18..8.23 rows=2 width=28) (actual time=0.020..0.020 rows=0 loops=1)
        Sort Key: created_at, id
        Presorted Key: created_at
        Full-sort Groups: 1  Sort Method: quicksort  Average Memory: 25kB  Peak Memory: 25kB
        ->  Index Scan using "idx_orders_status_createdAt" on orders o  (cost=0.15..8.17 rows=1 width=28) (actual time=0.003..0.003 rows=0 loops=1)
              Index Cond: ((status = 'PENDING'::order_management.order_status_enum) AND (created_at <= (now() - '00:30:00'::interval)))
Planning Time: 0.141 ms
Execution Time: 0.040 ms
```
*Plan Explanation:* The composite index condition matches both `status = 'PENDING'` and the time threshold. The results are presorted by `created_at`, requiring only a fast incremental sort for tie-breaking on `id`. Total execution: 0.040 ms.

### 5. Sales Summary Aggregation with Timezone Conversion
```sql
EXPLAIN ANALYZE
SELECT
  date_trunc('day', o.created_at AT TIME ZONE 'Asia/Kolkata')::date AS period,
  COUNT(*) AS order_count,
  COALESCE(SUM(o.total_amount), 0) AS revenue
FROM "order_management"."orders" o
WHERE (o.created_at AT TIME ZONE 'Asia/Kolkata')::date BETWEEN '2026-01-01'::date AND '2026-12-31'::date
  AND o.status IN ('COMPLETED', 'CONFIRMED')
GROUP BY 1;
```
**Actual Output:**
```
GroupAggregate  (cost=11.34..11.37 rows=1 width=44) (actual time=1.776..1.779 rows=3 loops=1)
  Group Key: ((date_trunc('day'::text, (created_at AT TIME ZONE 'Asia/Kolkata'::text)))::date)
  ->  Sort  (cost=11.34..11.35 rows=1 width=20) (actual time=1.560..1.561 rows=3 loops=1)
        Sort Key: ((date_trunc('day'::text, (created_at AT TIME ZONE 'Asia/Kolkata'::text)))::date)
        Sort Method: quicksort  Memory: 25kB
        ->  Bitmap Heap Scan on orders o  (cost=4.17..11.33 rows=1 width=20) (actual time=1.346..1.352 rows=3 loops=1)
              Recheck Cond: (status = ANY ('{COMPLETED,CONFIRMED}'::order_management.order_status_enum[]))
              Filter: ((((created_at AT TIME ZONE 'Asia/Kolkata'::text))::date >= '2026-01-01'::date) AND (((created_at AT TIME ZONE 'Asia/Kolkata'::text))::date <= '2026-12-31'::date))
              Heap Blocks: exact=1
              ->  Bitmap Index Scan on "idx_orders_status_createdAt"  (cost=0.00..4.17 rows=3 width=0) (actual time=0.005..0.005 rows=6 loops=1)
                    Index Cond: (status = ANY ('{COMPLETED,CONFIRMED}'::order_management.order_status_enum[]))
Planning Time: 0.806 ms
Execution Time: 2.174 ms
```
*Plan Explanation:* Uses `Bitmap Index Scan` on `idx_orders_status_createdAt` to filter confirmed and completed orders. Timezone date truncation is evaluated on heap rows before aggregating by period in 2.174 ms.

---

## API Documentation & Testing

### Swagger OpenAPI
Interactive API documentation is mounted at:
```
http://localhost:3000/api/docs
```
It includes schemas, request DTOs, response envelopes, authentication requirements, and role restrictions.

### Postman Collection
The complete test suite is available in [order_management.postman_collection.json](file:///a:/NestJS/Order_management_system%20-%20Advanced/order_management/order_management.postman_collection.json).
- **Variables included:** `baseUrl`, `accessToken`, `adminAccessToken`, `userAccessToken`, `refreshToken`, `userId`, `categoryId`, `productId`, `orderId`, `idempotencyKey`.
- **Pre-request & Test scripts:** Automatically generate unique idempotency keys and capture returned tokens and resource IDs into collection variables.
- **Coverage:** Covers every positive flow, validation error, authentication requirement, and role restriction.

---

## Confirmed Implementation Limitations

1. **Auto-Cancel Requires Pre-existing System User:**
   `OrderCleanupService` restores stock by attributing stock movements to `AUTO_CANCEL_SYSTEM_USER_ID`. If this UUID does not exist in `auth.users`, the cron job logs `Configured auto-cancel system user was not found` every minute.
2. **Admin Seed Email Discrepancy:**
   In `src/database/seeds/admin.seed.ts`, the existence check queries `email: 'admin@example.com'`, while the create operation inserts `email: 'admin@gmail.com'`. Running the seed script against a database that already has `admin@gmail.com` will throw a duplicate key violation.
3. **Report Range Cap:**
   Sales summary and top product reports are constrained to a maximum of 366/367 calendar days in `ReportsService` to prevent database memory exhaustion.
4. **CSV Export Response Bypassing:**
   `/reports/sales-summary/export` streams raw CSV data directly to the client (`Content-Type: text/csv`), intentionally bypassing the global `{ success, message, data }` response envelope used by all other endpoints.
5. **PgBouncer Transaction Pooling Mode:**
   Because PgBouncer operates in `POOL_MODE: transaction`, features that rely on session-level state across multiple queries (such as session locks or persistent temporary tables) cannot be used. TypeORM transactions explicitly use database query runners with discrete `BEGIN` and `COMMIT` cycles.
