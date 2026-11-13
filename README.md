# Booked Backend

Backend service for Cornell Booked, built with Express, TypeScript, and
PostgreSQL using TypeORM.

## Requirements

- Node.js and npm
- PostgreSQL

## Local setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create your local environment file from the example:

   ```sh
   cp .env.example .env
   ```

   Set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_NAME` in
   `.env` to match your PostgreSQL database. Do not put real credentials in
   `.env.example` or commit `.env`.

3. Start the development server:

   ```sh
   npm run dev
   ```

   The server listens on port `4000` by default. Set `PORT` in `.env` to use a
   different port. `GET /health` checks the database connection.

## Build and run

Compile the TypeScript application and start the compiled output:

```sh
npm run build
npm start
```

The build writes JavaScript to `dist/`. The start command runs
`dist/src/app.js`.

## Cornell sync

On startup, and then once an hour, the server pulls libraries and study spaces
from the Cornell Library WordPress API (`library.cornell.edu/wp-json`) and
stores them in the `libraries` and `rooms` tables. Libraries and rooms sync
independently, so one failing doesn't stop the other. Anything Cornell no
longer lists is removed. The sync code lives in `src/sync/`.

## API

| Route | Returns |
| --- | --- |
| `GET /libraries` | All libraries, sorted by name |
| `GET /rooms` | All rooms, sorted by title |
| `GET /rooms/search?q={query}` | Matching rooms, with their library, and pagination metadata |
| `GET /rooms/:id` | One room by its UUID, or `404` |
| `GET /health` | Whether the database is reachable |

Room search is case-insensitive and matches substrings in room titles,
library names, descriptions, and room attributes. Separate query words must
each match somewhere in the room data. Results prioritize title and library
matches. Use `limit` (default `20`, maximum `50`) and `offset` (default `0`) to
page through results; the response includes `results`, `total`, `limit`, and
`offset`.

For example:

```text
GET /rooms/search?q=quiet%20olin&limit=5
```

## Database schema

TypeORM schema synchronization is disabled. The schema is defined by the
migrations in `src/migrations/`, which run automatically when the server
starts.

After changing a model, generate a migration for it with the database running:

```sh
npm run migration:generate -- src/migrations/DescribeTheChange
```

For a local PostgreSQL database, Docker works well:

```sh
docker run -d --name booked-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=booked -p 5432:5432 postgres:16
```

with `DB_HOST=localhost`, `DB_PORT=5432`, `DB_USERNAME=postgres`,
`DB_PASSWORD=postgres` and `DB_NAME=booked` in `.env`.