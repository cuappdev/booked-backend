# Booked Backend

Backend service for Cornell Booked, built with Express, TypeScript, and
PostgreSQL using TypeORM. It copies library and study space data from Cornell's
website into a database every hour, and serves it to the Booked app.

## Requirements

- Node.js 18 or newer, and npm
- PostgreSQL. The setup below runs it in Docker, which is the easiest option.

## Local setup

1. Start a PostgreSQL database:

   ```sh
   docker run -d --name booked-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=booked -p 5432:5432 postgres:16
   ```

   You only need to run this once. Afterwards, start the database with
   `docker start booked-db`.

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create your environment file:

   ```sh
   cp .env.example .env
   ```

   The example values match the Docker database from step 1. If you use a
   different database, change them to match it (see
   [Environment variables](#environment-variables)). Don't commit `.env`.

4. Start the development server, which restarts when you change code:

   ```sh
   npm run dev
   ```

   On startup, the server creates its tables and starts listening on
   port `4000`. It then pulls data from Cornell, which takes a few seconds.
   The log shows `Synced 20 libraries from Cornell.` and
   `Synced 117 rooms from Cornell.` when it's done. The numbers change as
   Cornell updates its site. Until then, `/rooms` returns an empty list.

5. Check that it works:

   ```sh
   curl localhost:4000/health   # {"status":"healthy","database":"Connected"}
   curl localhost:4000/rooms
   ```

To use it from the Booked app, set `EXPO_PUBLIC_API_URL=http://localhost:4000`
in the app's `.env.local`.

## Environment variables

Set these in `.env`, or as environment variables when deploying.

| Variable | Default | Description |
| --- | --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | | Where the PostgreSQL database is. If `DB_NAME` is empty, the server connects to the `postgres` database instead. |
| `DB_USERNAME`, `DB_PASSWORD` | `postgres` | Database login |
| `PORT` | `4000` | Port the server listens on |
| `IS_PROD` | | Set to `true` to connect to the database over SSL, which most hosted PostgreSQL providers require |
| `DB_POOL_MAX` | `5` | Maximum number of database connections |

## Production

Compile the TypeScript to `dist/` and run the result:

```sh
npm run build
npm start
```

Migrations run automatically on startup, so there's no separate setup step.

## API

| Route | Returns |
| --- | --- |
| `GET /libraries` | All libraries, sorted by name |
| `GET /rooms` | All rooms, sorted by title |
| `GET /rooms/:id` | One room by its UUID, or `404` |
| `GET /health` | Whether the database is reachable |

## Cornell sync

On startup, and then once an hour, the server pulls libraries and study spaces
from the Cornell Library WordPress API (`library.cornell.edu/wp-json`) and
stores them in the `libraries` and `rooms` tables:

- Libraries and rooms sync independently, so one failing doesn't stop the other.
- Anything Cornell no longer lists is removed.
- An empty response from Cornell is treated as an error, so it never wipes the
  tables.

The sync code lives in `src/sync/`.

## Database schema

The schema is defined by the migrations in `src/migrations/`. TypeORM doesn't
change the schema to match the models on its own.

After changing a model, generate a migration for it with the database running:

```sh
npm run migration:generate -- src/migrations/DescribeTheChange
```
