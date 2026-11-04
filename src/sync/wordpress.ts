export const WP_API = "https://www.library.cornell.edu/wp-json/wp/v2";

// A hung request would otherwise stall the sync, and every hourly run after it.
const REQUEST_TIMEOUT_MS = 30_000;

function pageUrl(url: string, page: number): string {
  return `${url}${url.includes("?") ? "&" : "?"}per_page=100&page=${page}`;
}

async function fetchPage<T>(url: string, page: number): Promise<{ items: T[]; totalPages: number }> {
  const response = await fetch(pageUrl(url, page), { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Cornell API returned ${response.status} for ${url} page ${page}`);
  }
  return {
    items: (await response.json()) as T[],
    totalPages: Number(response.headers.get("X-WP-TotalPages") || "1"),
  };
}

export async function fetchAllPages<T>(url: string): Promise<T[]> {
  const first = await fetchPage<T>(url, 1);
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) => fetchPage<T>(url, i + 2))
  );
  return [first, ...rest].flatMap((page) => page.items);
}

const NAMED_ENTITIES: Record<string, string> = { amp: "&", quot: '"', lt: "<", gt: ">", apos: "'", nbsp: " " };

// Decodes in a single pass so decoded text is never decoded again
// (e.g. `&amp;lt;` becomes `&lt;`, not `<`).
export function decodeEntities(text: string): string {
  return text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (match, dec, hex, name) => {
    if (dec) return String.fromCodePoint(Number(dec));
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    return NAMED_ENTITIES[name.toLowerCase()] ?? match;
  });
}

// ACF leaves unset text fields as empty strings.
export const optional = (value: string | undefined): string | null => value?.trim() || null;
