import * as cheerio from "cheerio";

const REQUEST_TIMEOUT_MS = 30_000;

export type RoomDetails = {
  libraryName: string | null;
  description: string | null;
  reservationUrl: string | null;
};

export type RoomDetailsResult =
  | { status: "success"; details: RoomDetails }
  | { status: "error"; error: unknown };

function normalizeText(value: string): string | null {
  const text = value.replace(/\s+/g, " ").trim();
  return text || null;
}

function safeReservationUrl(value: string): string | null {
  const url = value.trim();
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export async function fetchRoomDetails(sourceUrl: string | null | undefined): Promise<RoomDetailsResult> {
  if (!sourceUrl) {
    return {
      status: "success",
      details: { libraryName: null, description: null, reservationUrl: null },
    };
  }

  try {
    const response = await fetch(sourceUrl, {
      headers: { "User-Agent": "Booked-backend Cornell room sync" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return {
        status: "error",
        error: new Error(`Room page returned ${response.status} for ${sourceUrl}`),
      };
    }

    const $ = cheerio.load(await response.text());

    const libraryName = normalizeText($(".library-details h4 a").first().text());
    const description = normalizeText($(".single-space-details p.space-description").first().text());
    const reservationUrl = safeReservationUrl($(".single-space-details a.reserve-space-btn").first().attr("href") ?? "");

    return {
      status: "success",
      details: { libraryName, description, reservationUrl },
    };
  } catch (error: unknown) {
    return { status: "error", error };
  }
}
