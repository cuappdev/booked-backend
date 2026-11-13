import { Brackets } from "typeorm";
import { Room } from "../models/Room";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export type RoomSearchParams = {
  query: string;
  terms: string[];
  limit: number;
  offset: number;
};

type ParseResult =
  | { success: true; value: RoomSearchParams }
  | { success: false; error: string };

function parseInteger(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseRoomSearchParams(
  query: unknown,
  limit: unknown,
  offset: unknown
): ParseResult {
  if (typeof query !== "string" || !query.trim()) {
    return { success: false, error: "Query parameter 'q' is required" };
  }

  const parsedLimit = limit === undefined ? DEFAULT_LIMIT : parseInteger(limit);
  if (parsedLimit === null || parsedLimit < 1 || parsedLimit > MAX_LIMIT) {
    return {
      success: false,
      error: `Query parameter 'limit' must be an integer between 1 and ${MAX_LIMIT}`,
    };
  }

  const parsedOffset = offset === undefined ? 0 : parseInteger(offset);
  if (parsedOffset === null) {
    return {
      success: false,
      error: "Query parameter 'offset' must be a non-negative integer",
    };
  }

  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  return {
    success: true,
    value: {
      query: normalizedQuery,
      terms: normalizedQuery.split(/\s+/),
      limit: parsedLimit,
      offset: parsedOffset,
    },
  };
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

const SEARCH_FIELDS = [
  "room.title",
  "room.description",
  "library.name",
  "array_to_string(room.spaceTypes, ' ')",
  "room.reservationType",
  "array_to_string(room.soundLevels, ' ')",
  "array_to_string(room.activities, ' ')",
  "array_to_string(room.amenities, ' ')",
  "array_to_string(room.audiences, ' ')",
  "array_to_string(room.support, ' ')",
];

export async function searchRooms(params: RoomSearchParams) {
  const escapedQuery = escapeLikePattern(params.query);
  const searchRank = `CASE
    WHEN room.title ILIKE :titlePrefix ESCAPE '\\' THEN 0
    WHEN room.title ILIKE :phrase ESCAPE '\\' THEN 1
    WHEN library.name ILIKE :phrase ESCAPE '\\' THEN 2
    ELSE 3
  END`;
  const queryBuilder = Room.createQueryBuilder("room")
    .leftJoinAndSelect("room.library", "library")
    .addSelect(searchRank, "search_rank")
    .where(
      new Brackets((query) => {
        params.terms.forEach((term, termIndex) => {
          const parameter = `term${termIndex}`;
          const pattern = `%${escapeLikePattern(term)}%`;
          const matches = SEARCH_FIELDS
            .map((field) => `${field} ILIKE :${parameter} ESCAPE '\\'`)
            .join(" OR ");

          query.andWhere(`(${matches})`, { [parameter]: pattern });
        });
      })
    )
    .orderBy("search_rank", "ASC")
    .addOrderBy("room.title", "ASC")
    .addOrderBy("room.id", "ASC")
    .setParameters({
      titlePrefix: `${escapedQuery}%`,
      phrase: `%${escapedQuery}%`,
    })
    .skip(params.offset)
    .take(params.limit);

  const [results, total] = await queryBuilder.getManyAndCount();
  return { results, total, limit: params.limit, offset: params.offset };
}
