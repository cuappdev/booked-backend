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

## Database schema

TypeORM schema synchronization is disabled, and the repository does not yet
contain database migrations. The models therefore do not create database
tables automatically. Add and run migrations before using application features
that require those tables.