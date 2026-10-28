import { In, Not } from "typeorm";
import { AppDataSource } from "../data-source";
import { Room, ReservationType } from "../models/Room";
import { WP_API, fetchAllPages, decodeEntities } from "./wordpress";

const SOURCE = "cornell";

const TAXONOMIES = ["sound_level", "space_features", "space_type", "space_type_2", "audience_type", "support_type"] as const;
type Taxonomy = typeof TAXONOMIES[number];
type TaxonomyMaps = Record<Taxonomy, Map<number, string>>;

interface ApiSpace {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  link: string;
  modified_gmt: string;
  sound_level: number[];
  space_features: number[];
  space_type: number[];
  space_type_2: number[];
  audience_type: number[];
  support_type: number[];
}

interface ApiTerm {
  id: number;
  name: string;
}

interface ApiMedia {
  id: number;
  post: number;
  source_url: string;
}

async function fetchTaxonomyMaps(): Promise<TaxonomyMaps> {
  const entries = await Promise.all(
    TAXONOMIES.map(async (taxonomy) => {
      const terms = await fetchAllPages<ApiTerm>(`${WP_API}/${taxonomy}`);
      return [taxonomy, new Map(terms.map((term) => [term.id, decodeEntities(term.name)]))] as const;
    })
  );
  return Object.fromEntries(entries) as TaxonomyMaps;
}

// Maps each space's ID to the first image attached to it.
async function fetchImageMap(spaceIds: number[]): Promise<Map<number, string>> {
  const params = spaceIds.map((id) => `parent[]=${id}`).join("&");
  const media = await fetchAllPages<ApiMedia>(`${WP_API}/media?${params}&_fields=id,post,source_url`);

  const imageMap = new Map<number, string>();
  for (const item of media) {
    if (!imageMap.has(item.post)) {
      imageMap.set(item.post, item.source_url);
    }
  }
  return imageMap;
}

function namesFromIds(ids: number[] | undefined, termMap: Map<number, string>): string[] {
  return (ids || []).map((id) => termMap.get(id)).filter((name): name is string => Boolean(name));
}

const RESERVATION_FEATURES: ReservationType[] = ["Reservable", "By request"];

const isReservationFeature = (feature: string): feature is ReservationType =>
  (RESERVATION_FEATURES as string[]).includes(feature);

const ACCESSIBLE = "Accessible";

function toRoom(apiSpace: ApiSpace, taxonomyMaps: TaxonomyMaps, imageMap: Map<number, string>, syncedAt: Date): Partial<Room> {
  const features = namesFromIds(apiSpace.space_features, taxonomyMaps.space_features);
  const support = namesFromIds(apiSpace.support_type, taxonomyMaps.support_type);

  return {
    source: SOURCE,
    sourceId: String(apiSpace.id),
    slug: apiSpace.slug,
    title: decodeEntities(apiSpace.title?.rendered || ""),
    sourceUrl: apiSpace.link,
    imageUrl: imageMap.get(apiSpace.id) ?? null,
    spaceTypes: namesFromIds(apiSpace.space_type_2, taxonomyMaps.space_type_2),
    reservationType: features.find(isReservationFeature) ?? "No reservation",
    soundLevels: namesFromIds(apiSpace.sound_level, taxonomyMaps.sound_level),
    activities: namesFromIds(apiSpace.space_type, taxonomyMaps.space_type),
    amenities: features.filter((feature) => !isReservationFeature(feature) && feature !== ACCESSIBLE),
    audiences: namesFromIds(apiSpace.audience_type, taxonomyMaps.audience_type),
    accessible: features.includes(ACCESSIBLE) || support.includes(ACCESSIBLE),
    support: support.filter((item) => item !== ACCESSIBLE),
    sourceUpdatedAt: apiSpace.modified_gmt ? new Date(`${apiSpace.modified_gmt}Z`) : null,
    lastSyncedAt: syncedAt,
  };
}

// Replaces the stored rooms with Cornell's current list of spaces. Returns how
// many rooms were synced.
export async function syncRooms(): Promise<number> {
  const apiSpaces = await fetchAllPages<ApiSpace>(`${WP_API}/library_spaces`);
  if (apiSpaces.length === 0) {
    throw new Error("Cornell returned no library spaces");
  }
  const [taxonomyMaps, imageMap] = await Promise.all([
    fetchTaxonomyMaps(),
    fetchImageMap(apiSpaces.map((space) => space.id)),
  ]);

  const syncedAt = new Date();
  const rooms = apiSpaces.map((space) => toRoom(space, taxonomyMaps, imageMap, syncedAt));

  await AppDataSource.transaction(async (manager) => {
    // Remove rooms Cornell dropped first, so a reused slug can't collide.
    await manager.delete(Room, { source: SOURCE, sourceId: Not(In(rooms.map((room) => room.sourceId))) });
    await manager.upsert(Room, rooms, ["source", "sourceId"]);
  });
  return rooms.length;
}
