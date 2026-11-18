import { afterEach, describe, expect, it, vi } from "vitest";
import { Brackets, SelectQueryBuilder, WhereExpressionBuilder } from "typeorm";
import { Room } from "../src/models/Room";
import { parseRoomSearchParams, searchRooms } from "../src/search/roomSearch";

type CapturedCondition = {
  expression: string;
  parameters?: Record<string, unknown>;
};

function mockSearchQuery(results: Room[] = [], total = results.length) {
  const conditions: CapturedCondition[] = [];
  const whereExpression = {
    andWhere(expression: string, parameters?: Record<string, unknown>) {
      conditions.push({ expression, parameters });
      return this;
    },
  };

  const queryBuilder = {
    leftJoinAndSelect: vi.fn(),
    addSelect: vi.fn(),
    where: vi.fn((brackets: Brackets) => {
      brackets.whereFactory(whereExpression as WhereExpressionBuilder);
      return queryBuilder;
    }),
    orderBy: vi.fn(),
    addOrderBy: vi.fn(),
    setParameters: vi.fn(),
    skip: vi.fn(),
    take: vi.fn(),
    getManyAndCount: vi.fn().mockResolvedValue([results, total]),
  };

  queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
  queryBuilder.addSelect.mockReturnValue(queryBuilder);
  queryBuilder.orderBy.mockReturnValue(queryBuilder);
  queryBuilder.addOrderBy.mockReturnValue(queryBuilder);
  queryBuilder.setParameters.mockReturnValue(queryBuilder);
  queryBuilder.skip.mockReturnValue(queryBuilder);
  queryBuilder.take.mockReturnValue(queryBuilder);

  vi.spyOn(Room, "createQueryBuilder").mockReturnValue(
    queryBuilder as unknown as SelectQueryBuilder<Room>
  );

  return { conditions, queryBuilder };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parseRoomSearchParams", () => {
  it("trims the query, splits it into terms, and applies pagination defaults", () => {
    expect(parseRoomSearchParams("  quiet   olin  ", undefined, undefined)).toEqual({
      success: true,
      value: {
        query: "quiet olin",
        terms: ["quiet", "olin"],
        limit: 20,
        offset: 0,
      },
    });
  });

  describe("searchRooms", () => {
    it("searches every configured field and requires every term to match", async () => {
      const { conditions, queryBuilder } = mockSearchQuery([], 3);
      const parsed = parseRoomSearchParams("quiet olin", undefined, undefined);
      if (!parsed.success) {
        throw new Error("Expected valid search parameters");
      }

      const response = await searchRooms(parsed.value);

      expect(conditions).toHaveLength(2);
      expect(conditions[0].expression).toContain("room.title ILIKE :term0");
      expect(conditions[0].expression).toContain("room.description ILIKE :term0");
      expect(conditions[0].expression).toContain("library.name ILIKE :term0");
      expect(conditions[0].expression).toContain(
        "array_to_string(room.amenities, ' ') ILIKE :term0"
      );
      expect(conditions[0].expression).toContain(" OR ");
      expect(conditions[1].expression).toContain("room.title ILIKE :term1");
      expect(conditions[0].parameters).toEqual({ term0: "%quiet%" });
      expect(conditions[1].parameters).toEqual({ term1: "%olin%" });
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith("room.library", "library");
      expect(response).toEqual({ results: [], total: 3, limit: 20, offset: 0 });
    });

    it("escapes LIKE wildcard characters in the search term", async () => {
      const { conditions } = mockSearchQuery();
      const parsed = parseRoomSearchParams("100%_ready", undefined, undefined);
      if (!parsed.success) {
        throw new Error("Expected valid search parameters");
      }

      await searchRooms(parsed.value);

      expect(conditions[0].parameters).toEqual({ term0: "%100\\%\\_ready%" });
    });

    it("prioritizes title and library matches, then applies stable pagination", async () => {
      const { queryBuilder } = mockSearchQuery();
      const parsed = parseRoomSearchParams("Olin", "5", "10");
      if (!parsed.success) {
        throw new Error("Expected valid search parameters");
      }

      await searchRooms(parsed.value);

      const rankExpression = queryBuilder.addSelect.mock.calls[0][0];
      expect(rankExpression).toContain("WHEN room.title ILIKE :titlePrefix");
      expect(rankExpression).toContain("WHEN room.title ILIKE :phrase");
      expect(rankExpression).toContain("WHEN library.name ILIKE :phrase");
      expect(queryBuilder.addSelect).toHaveBeenCalledWith(rankExpression, "search_rank");
      expect(queryBuilder.orderBy).toHaveBeenCalledWith("search_rank", "ASC");
      expect(queryBuilder.setParameters).toHaveBeenCalledWith({
        titlePrefix: "Olin%",
        phrase: "%Olin%",
      });
      expect(queryBuilder.addOrderBy).toHaveBeenNthCalledWith(1, "room.title", "ASC");
      expect(queryBuilder.addOrderBy).toHaveBeenNthCalledWith(2, "room.id", "ASC");
      expect(queryBuilder.skip).toHaveBeenCalledWith(10);
      expect(queryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  it("accepts a custom limit and offset", () => {
    expect(parseRoomSearchParams("study", "5", "10")).toMatchObject({
      success: true,
      value: { limit: 5, offset: 10 },
    });
  });

  it.each([undefined, "", "   ", ["study"]])(
    "rejects a missing or invalid search query: %s",
    (query) => {
      expect(parseRoomSearchParams(query, undefined, undefined)).toMatchObject({
        success: false,
        error: "Query parameter 'q' is required",
      });
    }
  );

  it.each(["0", "51", "1.5", "-1", "abc", ["5"]])(
    "rejects an invalid limit: %s",
    (limit) => {
      expect(parseRoomSearchParams("study", limit, undefined)).toMatchObject({
        success: false,
        error: "Query parameter 'limit' must be an integer between 1 and 50",
      });
    }
  );

  it.each(["-1", "1.5", "abc", ["1"]])("rejects an invalid offset: %s", (offset) => {
    expect(parseRoomSearchParams("study", undefined, offset)).toMatchObject({
      success: false,
      error: "Query parameter 'offset' must be a non-negative integer",
    });
  });
});
