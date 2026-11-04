import dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response } from "express";
import { AppDataSource } from "./data-source";
import { router } from "./routes";
import { scheduleSync } from "./sync";

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

  app.use(router);

  app.listen(port, () => {
    console.log(`Booked backend server running on http://localhost:${port}`);
  });

  scheduleSync();

  return app;
}

createApp().catch((error: unknown) => {
  console.error("Failed to start Booked backend:", error);
  process.exit(1);
});