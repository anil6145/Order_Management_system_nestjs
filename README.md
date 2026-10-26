# Order Management System (Advanced)

A NestJS REST API for managing orders, products, inventory, users, and sales reports. The project uses PostgreSQL for data storage, TypeORM for database operations, PgBouncer for connection pooling, and BullMQ with Redis for background audit processing.

The application source code, migrations, tests, configuration, and supporting documentation are available in the `order_management` directory.

## Architecture

- **Backend:** NestJS, Node.js, Express, TypeScript
- **Database:** PostgreSQL with TypeORM migrations
- **Connection pooling:** PgBouncer using transaction mode
- **Background jobs:** BullMQ and Redis
- **Authentication:** JWT with refresh tokens and role-based access
- **API documentation:** Swagger at `/api/docs`
- **Testing:** Vitest and Supertest

## Setup

### Prerequisites

Install the following before running the project:

- Node.js 20 or later, using a version supported by the project dependencies
- npm
- Docker Desktop and Docker Compose
- PostgreSQL 14 or later
- Redis, for BullMQ jobs

PostgreSQL and Redis can run locally or on another accessible server. Check the environment configuration before starting the application.

### Installation

Clone the repository and install the dependencies.

```bash
git clone <repo-url>
cd order_management
npm install
```

Create the environment file from the template.

```bash
cp .env.example .env
```

Update `.env` with the database credentials, JWT secrets, Redis connection details, and system user UUID required by the application. Do not commit this file to Git.

Start PgBouncer:

```bash
docker compose up -d pgbouncer
```

Run the database migrations and create the initial admin account:

```bash
npm run migration:run
npm run seed:admin
```

Start the application in development mode:

```bash
npm run start:dev
```

For a production build, run:

```bash
npm run build
npm run start:prod
```

Once the server is running, open `http://localhost:3000/api/docs` to view the available endpoints.

## Environment Configuration

The `.env.example` file contains the environment variables used by the application. The table below lists the main settings; check the template and configuration code for the exact names and defaults used by your current setup.

| Variable | Purpose |
|---|---|
| `PORT` | Port used by the NestJS server |
| `DB_HOST` | PostgreSQL or PgBouncer hostname |
| `DB_PORT` | Database connection port |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `DB_NAME` | Database name |
| `DB_POOL_MAX` | Maximum connections in the application-side pool |
| `DB_IDLE_TIMEOUT_MS` | Timeout for idle connections |
| `DB_CONNECTION_TIMEOUT_MS` | Maximum wait for a database connection |
| `DB_STATEMENT_TIMEOUT_MS` | SQL statement timeout |
| `PGBOUNCER_HOST_PORT` | Host port mapped to the PgBouncer container |
| `PGBOUNCER_POOL_SIZE` | Configured PgBouncer server pool size |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens |
| `JWT_REFRESH_SECRET` | Secret used to sign refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry |
| `AUTO_CANCEL_SYSTEM_USER_ID` | Existing user UUID used for automatic stock-restoration movements |
| `REDIS_HOST` | Redis hostname |
| `REDIS_PORT` | Redis port |

Keep the application connection settings consistent with `docker-compose.yml`. For the current local PgBouncer setup, the application connects through the published host port, normally `6432`, rather than connecting directly to PostgreSQL on port `5432`.

## NPM Scripts

The following commands are available if they are defined in the project's `package.json`.

```bash
# Application
npm run start
npm run start:dev
npm run build

# Database migrations
npm run migration:show
npm run migration:run
npm run migration:revert
npm run migration:generate

# Admin seed
npm run seed:admin

# Tests
npm run test
npm run test:watch
npm run test:e2e

```

Migration generation should be reviewed before applying changes to a shared database. For an existing database, use migrations to manage schema changes instead of enabling automatic schema synchronization.

## Docker and PgBouncer

PgBouncer is configured in `docker-compose.yml` using the `edoburu/pgbouncer` image. It runs in transaction pooling mode and forwards database connections to PostgreSQL.

The current setup uses the PostgreSQL instance already running on the host machine. PostgreSQL does not need to be moved into Docker for this configuration.

### Connection flow

```text
NestJS application
        |
        | Host port 6432
        v
PgBouncer container
(Transaction pooling)
        |
        | PostgreSQL port 5432
        v
Existing PostgreSQL database
```

The application maintains its own connection pool, while PgBouncer manages the connections used to reach PostgreSQL. These are separate pool settings and should be configured with the database's connection limit in mind.

### Useful commands

Start PgBouncer:

```bash
docker compose up -d pgbouncer
```

Check the running containers:

```bash
docker compose ps
```

View PgBouncer logs:

```bash
docker compose logs -f pgbouncer
```

Stop the Compose services:

```bash
docker compose down
```

Check whether database migrations can connect through the configured connection:

```bash
npm run migration:show
```

If the connection fails, check the container logs, database credentials, port mapping, and PostgreSQL host settings.

Because transaction pooling can assign a different server connection to each transaction, application code must not depend on session state persisting between transactions. Database operations should use short transactions and avoid unsupported session-level assumptions.

## Database Indexes

The schema includes indexes and constraints for common lookups, order processing, and reporting. The migration files are the source of truth for the actual index names and definitions.

| Table | Index or constraint | Purpose |
|---|---|---|
| `auth.users` | Primary key and unique email | Looks up users and prevents duplicate email registrations |
| `order_management.orders` | `idx_orders_status_createdAt` | Supports filtering orders by status and creation time |
| `order_management.orders` | `idx_orders_user_created_at` | Supports a user's order history, sorted by creation time |
| `order_management.orders` | `UQ_orders_user_idempotency` | Prevents the same user from creating duplicate orders with the same idempotency key |
| `order_management.order_items` | `idx_order_items_order_id` | Retrieves the items belonging to an order |
| `order_management.order_items` | `idx_order_items_product_id` | Helps queries that filter or aggregate order items by product |
| `order_management.products` | `idx_products_category_id` | Supports filtering products by category |
| `order_management.products` | `idx_products_name_trgm` | Supports product-name searches using trigram indexing |
| `order_management.order_status_history` | `idx_order_status_history_order_id` | Retrieves an order's status history |
| `order_management.audit_logs` | Entity and user indexes | Supports audit lookups by entity and user activity |

Primary keys, unique constraints, and foreign keys also enforce data integrity. The exact indexes used by a query depend on the query conditions, available data, and PostgreSQL's execution plan.

## Timezone Handling

Timestamp columns use PostgreSQL `timestamptz` where defined by the schema. This allows timestamps to represent actual points in time independently of the client's local timezone.

Sales reports use `Asia/Kolkata` when grouping orders into business dates. For example:

```sql
(o.created_at AT TIME ZONE 'Asia/Kolkata')::date
```

This converts the stored timestamp to the Indian business date before extracting the date, so report boundaries follow IST rather than the database server's local timezone.

Order numbers are generated using a database sequence and a date prefix. The relevant SQL expression is:

```sql
'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
LPAD(
  NEXTVAL('order_management.order_number_seq')::TEXT,
  6,
  '0'
)
```

The sequence generates unique numeric suffixes. PostgreSQL sequences are not transactional, so gaps in the numbering can occur.

## Query Performance

`EXPLAIN ANALYZE` was used to inspect several queries against the development database. The results below are examples from that environment, not performance guarantees for every database size or workload.

### 1. Find recent pending orders

```sql
EXPLAIN ANALYZE
SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at
FROM order_management.orders o
WHERE o.status = 'PENDING'
ORDER BY o.created_at DESC
LIMIT 10;
```

The observed plan used `idx_orders_status_createdAt` with an index scan. This index can help PostgreSQL find pending orders and retrieve them in creation-time order without a separate full sort.

### 2. Find a user's recent orders

```sql
EXPLAIN ANALYZE
SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at
FROM order_management.orders o
WHERE o.user_id = '6d3910aa-7b85-46dc-a404-bde9feaf2b98'
ORDER BY o.created_at DESC
LIMIT 10;
```

The observed plan used `idx_orders_user_created_at`. This supports the user filter and ordering used by the order-history endpoint.

Replace the example UUID with a valid user ID when testing against another database.

### 3. Retrieve order items

```sql
EXPLAIN ANALYZE
SELECT oi.id, oi.order_id, oi.product_id,
       oi.quantity, oi.unit_price, oi.line_total
FROM order_management.order_items oi
WHERE oi.order_id = '00000000-0000-0000-0000-000000000000'::uuid;
```

The observed plan used a bitmap index scan on `idx_order_items_order_id`, followed by a bitmap heap scan. PostgreSQL can use this approach when retrieving matching rows through an index.

### 4. Find pending orders eligible for cancellation

```sql
EXPLAIN ANALYZE
SELECT o.id, o.status, o.created_at
FROM order_management.orders o
WHERE o.status = 'PENDING'
  AND o.created_at <= NOW() - INTERVAL '30 minutes'
ORDER BY o.created_at ASC, o.id ASC
LIMIT 50;
```

The status and creation-time index helps identify old pending orders. The cleanup job can process these in batches instead of loading every eligible order at once.

### 5. Summarize sales by Indian business date

```sql
EXPLAIN ANALYZE
SELECT
  (o.created_at AT TIME ZONE 'Asia/Kolkata')::date AS period,
  COUNT(*) AS order_count,
  COALESCE(SUM(o.total_amount), 0) AS revenue
FROM order_management.orders o
WHERE (o.created_at AT TIME ZONE 'Asia/Kolkata')::date
      BETWEEN '2026-01-01'::date AND '2026-12-31'::date
  AND o.status IN ('COMPLETED', 'CONFIRMED')
GROUP BY 1
ORDER BY 1;
```

The observed plan filtered eligible orders, sorted the results, and aggregated them by date. Applying a timezone conversion to a timestamp in the filter can limit the usefulness of a regular index on `created_at` for date-range filtering. For larger datasets, consider converting the requested IST date boundaries to timestamp boundaries and filtering `created_at` directly. Compare both plans using representative data before changing the report query.

The execution times recorded during development are specific to the test database and its data volume. Run `EXPLAIN ANALYZE` again after significant data or schema changes.

## API Documentation and Testing

### Swagger

Open the API documentation at:

`http://localhost:3000/api/docs`

Swagger provides the available routes, request schemas, response formats, and authentication requirements configured for the application.

### Postman

The Postman collection is available at:

`order_management.postman_collection.json`

Import the collection into Postman and configure its variables before running the requests. The collection uses variables for the base URL, access tokens, refresh token, and resource IDs such as users, categories, products, and orders.

Where configured, the pre-request and test scripts generate idempotency keys and save returned tokens or resource IDs for later requests.

Run the tests with the project's test scripts:

```bash
npm run test
npm run test:e2e
```

Use a test database and valid environment configuration for integration tests. Do not run destructive test cases against production data.

## Known Limitations and Configuration Notes

1. **Automatic cancellation:** The cleanup job uses `AUTO_CANCEL_SYSTEM_USER_ID` when recording stock movements during cancellation. The configured UUID must belong to an existing user if the database enforces that relationship. Otherwise, stock restoration or movement recording may fail.

2. **Admin seed email:** Check `src/database/seeds/admin.seed.ts` if the admin seed fails with a duplicate email error. The email used in the existence check must match the email used when creating the admin account. Inconsistent values can cause the seed to attempt to insert an account that already exists.

3. **Report date range:** The sales summary and top-products reports enforce a maximum date range in the service. Check the current validation in `ReportsService` for the exact limit before requesting a longer period.

4. **CSV export:** The sales-summary export streams CSV data directly with a `text/csv` response instead of using the normal JSON response envelope. Clients should handle this endpoint as a file download.

5. **PgBouncer transaction pooling:** Code must not rely on session-level settings, persistent temporary tables, or other state that must survive across separate transactions. Keep transactions short and ensure that all operations requiring the same transaction use the same transaction-bound connection.

6. **Redis dependency:** BullMQ requires a reachable Redis instance. If Redis is unavailable, background jobs such as asynchronous audit processing may fail even when the HTTP server starts successfully.

7. **Performance results:** The recorded query plans were obtained from a development database. Re-run the queries against representative data before using the results to make production capacity or performance decisions.

## Project Files

- `src/` — application modules, controllers, services, DTOs, and entities
- `src/database/` — database configuration, migrations, and seed scripts
- `test/` — end-to-end tests, if configured in the repository
- `.env.example` — environment variable template
- `docker-compose.yml` — PgBouncer container configuration
- `order_management.postman_collection.json` — API requests for manual testing
- `README.md` — project setup and implementation notes
