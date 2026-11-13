import { NextFunction, Request, Response, Router } from "express";
import { Library } from "./models/Library";
import { Room } from "./models/Room";
import { parseRoomSearchParams, searchRooms } from "./search/roomSearch";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Express 4 doesn't catch rejected promises, so pass them on to its error handler.
const handle = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res).catch(next);

export const router = Router();

router.get("/libraries", handle(async (_req, res) => {
  res.json(await Library.find({ order: { name: "ASC" } }));
}));

router.get("/libraries/:id", handle(async (req, res) => {
  const library = UUID.test(req.params.id) ? await Library.findOneBy({ id: req.params.id }) : null;
  if (!library) {
    res.status(404).json({ error: "Library not found" });
    return;
  }
  res.json(library);
}));

router.get("/rooms", handle(async (_req, res) => {
  res.json(await Room.find({ order: { title: "ASC" } }));
}));

router.get("/rooms/search", handle(async (req, res) => {
  const parsed = parseRoomSearchParams(req.query.q, req.query.limit, req.query.offset);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  res.json(await searchRooms(parsed.value));
}));

router.get("/rooms/:id", handle(async (req, res) => {
  const room = UUID.test(req.params.id) ? await Room.findOneBy({ id: req.params.id }) : null;
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(room);
}));
