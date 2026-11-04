import { In, Not } from "typeorm";
import { AppDataSource } from "../data-source";
import { Library } from "../models/Library";
import { WP_API, fetchAllPages, decodeEntities, optional } from "./wordpress";

interface ApiLibrary {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  acf: {
    library_unit?: { label?: string };
    library_address?: string;
    google_map_location?: string;
    full_hours?: string;
    library_url?: string;
    reference_phone?: string;
    email_contact?: string;
    library_photo?: { url?: string } | false;
  };
}

function toLibrary(apiLibrary: ApiLibrary): Partial<Library> {
  const acf = apiLibrary.acf || {};
  return {
    sourceId: String(apiLibrary.id),
    slug: apiLibrary.slug,
    name: acf.library_unit?.label || decodeEntities(apiLibrary.title?.rendered || ""),
    address: optional(acf.library_address?.replace(/\r\n/g, "\n")),
    mapUrl: optional(acf.google_map_location),
    hoursUrl: optional(acf.full_hours),
    phone: optional(acf.reference_phone),
    email: optional(acf.email_contact),
    imageUrl: optional(acf.library_photo ? acf.library_photo.url : undefined),
    websiteUrl: optional(acf.library_url),
  };
}

// Replaces the stored libraries with Cornell's current list. Returns how many
// libraries were synced.
export async function syncLibraries(): Promise<number> {
  const apiLibraries = await fetchAllPages<ApiLibrary>(`${WP_API}/unit_libraries?_fields=id,slug,title,acf`);
  if (apiLibraries.length === 0) {
    throw new Error("Cornell returned no libraries");
  }
  const libraries = apiLibraries.map(toLibrary);

  await AppDataSource.transaction(async (manager) => {
    // Remove libraries Cornell dropped first, so a reused slug can't collide.
    await manager.delete(Library, { sourceId: Not(In(libraries.map((library) => library.sourceId))) });
    await manager.upsert(Library, libraries, ["sourceId"]);
  });
  return libraries.length;
}
