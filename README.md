# Booked Backend

Backend service for Cornell Booked, built with Express, TypeScript, and
PostgreSQL using TypeORM. It copies library and study space data from Cornell's
website into a database every hour, and serves it to the Booked app.

## Local setup

You need Node.js 18 or newer, npm, and Docker (for the database).

1. Start a PostgreSQL database:

   ```sh
   docker run -d --name booked-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=booked -p 5432:5432 postgres:16
   ```

   You only need to run this once. Afterwards, start the database with
   `docker start booked-db`.

2. Install dependencies and create your environment file:

   ```sh
   npm install
   cp .env.example .env
   ```

   The example values match the database from step 1. Don't commit `.env`.

3. Start the development server, which restarts when you change code:

   ```sh
   npm run dev
   ```

   The server creates its tables, listens on port `4000`, and pulls data from
   Cornell. When the log shows `Synced … rooms from Cornell.`, check it works:

   ```sh
   curl localhost:4000/health   # {"status":"healthy","database":"Connected"}
   curl localhost:4000/rooms
   ```

   Until that first sync finishes, `/rooms` returns an empty list.

To use it from the Booked app, set `EXPO_PUBLIC_API_URL=http://localhost:4000`
in the app's `.env.local`.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | | Where the PostgreSQL database is. If `DB_NAME` is empty, the server connects to the `postgres` database instead. |
| `DB_USERNAME`, `DB_PASSWORD` | `postgres` | Database login |
| `PORT` | `4000` | Port the server listens on |
| `IS_PROD` | | Set to `true` to connect to the database over SSL, which hosted PostgreSQL usually requires. Not needed with `docker-compose.yml`. |
| `DB_POOL_MAX` | `5` | Maximum number of database connections |
| `BOOKED_ENV` | `dev` | Server only: which Docker image `docker-compose.yml` runs (`dev` or `prod`) |

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

## How it works

- **Cornell sync** (`src/sync/`): on startup, and then once an hour, the server
  pulls libraries and study spaces from Cornell's WordPress API into the
  `libraries` and `rooms` tables. Libraries and rooms sync independently, so
  one failing doesn't stop the other. Anything Cornell no longer lists is
  removed, but an empty response from Cornell never wipes the tables.
- **Database schema** (`src/migrations/`): migrations run automatically when
  the server starts. After changing a model, generate one with the database
  running:

  ```sh
  npm run migration:generate -- src/migrations/DescribeTheChange
  ```

## Deployment

The server and its PostgreSQL database run as two Docker containers on one
DigitalOcean droplet, like other AppDev backends. A GitHub Actions workflow
builds the image, pushes it to Docker Hub (`cornellappdev/booked-dev` or
`cornellappdev/booked-prod`), and restarts the containers on the droplet. The
database keeps its data in a Docker volume, so deploys don't touch it.

To deploy, open **Actions** in GitHub, pick the **Deploy to dev** or
**Deploy to prod** workflow, and click **Run workflow**. Once that works,
uncomment the `push` trigger in `.github/workflows/deploy-*.yml` to deploy
automatically on every merge to `main` (dev) or `release` (prod).

To keep costs down, you can set up prod only and test changes locally.

### One-time setup

1. **Docker Hub:** create `cornellappdev/booked-dev` and `cornellappdev/booked-prod`.
2. **Droplet:** create one with at least 1 GB of memory, install Docker and
   docker-compose, then create `~/docker-compose/` containing:
   - a copy of `docker-compose.yml` from this repo
   - a `.env` with `DB_USERNAME`, a strong `DB_PASSWORD`, `DB_NAME` and
     `BOOKED_ENV=dev` or `BOOKED_ENV=prod`. Leave out `IS_PROD`, since the app
     reaches the database inside the droplet without SSL.

   The server only accepts connections from the droplet itself
   (`127.0.0.1:4000`), so put a reverse proxy with HTTPS, such as nginx, in
   front of it at a domain like `booked-backend.cornellappdev.com`.
3. **GitHub secrets** (Settings → Secrets and variables → Actions):
   `DOCKER_USERNAME`, `DOCKER_PASSWORD`, `SERVER_USERNAME`, plus each
   droplet's address and SSH private key as `DEV_SERVER_HOST` /
   `DEV_SERVER_KEY` and `PROD_SERVER_HOST` / `PROD_SERVER_KEY`.

After the first deploy, check `https://<your domain>/health`, then set the
Booked app's production `EXPO_PUBLIC_API_URL` to that domain.

### Changing the database password

Postgres only reads `DB_PASSWORD` the first time it creates its data, so
changing `.env` alone isn't enough. On the droplet:

```sh
cd ~/docker-compose
docker-compose exec db psql -U postgres -c "ALTER USER postgres PASSWORD 'new-password'"
```

Then set `DB_PASSWORD=new-password` in `.env` and restart the app with
`docker-compose up -d --force-recreate app`.

### Backups

The database has no automatic backups. Today that's fine: everything in it is
copied from Cornell, and a fresh server rebuilds it with its first sync. Once
it stores user data, such as favorites, turn on DigitalOcean's droplet backups
or schedule a `pg_dump`.
