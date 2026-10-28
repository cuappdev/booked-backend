import { NextFunction, Request, Response, Router } from "express";
import { Library } from "./models/Library";
import { Room } from "./models/Room";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Express 4 doesn't catch rejected promises, so pass them on to its error handler.
const handle = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

export const router = Router();

router.get("/libraries", handle(async (_req, res) => {
  res.json(await Library.find({ order: { name: "ASC" } }));
}));

router.get("/rooms", handle(async (_req, res) => {
  res.json(await Room.find({ order: { title: "ASC" } }));
}));

router.get("/rooms/:id", handle(async (req, res) => {
  const room = UUID.test(req.params.id) ? await Room.findOneBy({ id: req.params.id }) : null;
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(room);
}));
