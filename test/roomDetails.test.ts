import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRoomDetails } from "../src/sync/roomDetails";

function mockHtml(html: string): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(html, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      })
    )
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchRoomDetails", () => {
  it("extracts the library, description, and reservation URL", async () => {
    mockHtml(`
      <div class="library-details">
        <h4><a href="/mann/">Mann Library</a></h4>
      </div>
      <div class="single-space-details">
        <p class="space-description">
          The workstations include built-in LCDs and computers.
        </p>
        <a class="reserve-space-btn" href="https://spaces.library.cornell.edu/space/18631">
          Reserve
        </a>
      </div>
    `);

    await expect(fetchRoomDetails("https://example.com/room")).resolves.toEqual({
      status: "success",
      details: {
        libraryName: "Mann Library",
        description: "The workstations include built-in LCDs and computers.",
        reservationUrl: "https://spaces.library.cornell.edu/space/18631",
      },
    });
  });

  it("returns null fields when description and reserve content are absent", async () => {
    mockHtml(`
      <div class="library-details">
        <h4><a>Clarke Africana Library</a></h4>
      </div>
    `);

    await expect(fetchRoomDetails("https://example.com/open-study")).resolves.toEqual({
      status: "success",
      details: {
        libraryName: "Clarke Africana Library",
        description: null,
        reservationUrl: null,
      },
    });
  });

  it("returns null details when no source URL is available", async () => {
    await expect(fetchRoomDetails(null)).resolves.toEqual({
      status: "success",
      details: {
        libraryName: null,
        description: null,
        reservationUrl: null,
      },
    });
  });

  it("returns null instead of an invalid reservation URL", async () => {
    mockHtml(`
      <div class="single-space-details">
        <a class="reserve-space-btn" href="javascript:alert('invalid')">Reserve</a>
      </div>
    `);

    await expect(fetchRoomDetails("https://example.com/room")).resolves.toEqual({
      status: "success",
      details: {
        libraryName: null,
        description: null,
        reservationUrl: null,
      },
    });
  });

  it("reports HTTP errors instead of treating them as successful missing fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Not found", { status: 404 }))
    );

    const result = await fetchRoomDetails("https://example.com/missing");

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(String(result.error)).toContain("404");
    }
  });

  it("reports network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));

    const result = await fetchRoomDetails("https://example.com/room");

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(String(result.error)).toContain("Connection refused");
    }
  });
});
