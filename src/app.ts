import dotenv from "dotenv";
dotenv.config();

import "reflect-metadata";
import express, { Express, Request, Response } from "express";
import { DataSource } from "typeorm";
import * as path from "path";

const dbConfig = require("../ormconfig");

export const AppDataSource = new DataSource(dbConfig);

async function createApp(): Promise<Express> {
  await AppDataSource.initialize()
    .then(() => {
      console.log("Database connection established successfully.");
    })
    .catch((error: unknown) => {
      console.error("Database connection failed:", error);
      throw new Error("Failed to connect to the database.");
    });

  const app: Express = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const port = process.env.PORT ?? 4000;

  app.get("/", (_req: Request, res: Response) => {
    res.status(200).json({
      message: "Welcome to Cornell Booked API",
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/health", async (_req: Request, res: Response) => {
    try {
      await AppDataSource.query("SELECT 1");
      res.status(200).json({
        status: "healthy",
        database: "Connected",
      });
    } catch (error: any) {
      res.status(500).json({
        status: "error",
        database: "Not connected",
        error: error.message,
      });
    }
  });

  app.listen(port, () => {
    console.log(`Booked backend server running on http://localhost:${port}`);
  });

  return app;
}

createApp().catch((error: unknown) => {
  console.error("Failed to start Booked backend:", error);
  process.exit(1);
});