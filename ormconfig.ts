require("dotenv").config();
import * as path from "path";

function pgExtra(): {
  max: number;
  ssl?: { rejectUnauthorized: boolean };
} {
  const extra: { max: number; ssl?: { rejectUnauthorized: boolean } } = {
    max: Number(process.env.DB_POOL_MAX || 5),
  };
  if (process.env.IS_PROD?.toLowerCase() === "true") {
    extra.ssl = { rejectUnauthorized: false };
  }
  return extra;
}

module.exports = {
  type: "postgres",
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME,
  entities: [
    path.join(__dirname, "src/models/*.ts"),
    path.join(__dirname, "src/models/*.js"),
  ],
  synchronize: false,
  migrationsRun: false,
  migrations: [
    path.join(__dirname, "src/migrations/*.ts"),
    path.join(__dirname, "src/migrations/*.js"),
  ],
  extra: pgExtra(),
};