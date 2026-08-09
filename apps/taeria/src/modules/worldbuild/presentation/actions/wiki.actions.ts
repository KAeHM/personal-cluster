"use server";

import { requireAuth } from "@/modules/auth";
import {
  getWikiEntryBySlug,
  listWikiEntries,
  listWikiKindSlugs,
} from "../../application/use-cases/get-wiki-entry-by-slug";

export async function getWikiEntryBySlugAction(slug: string) {
  await requireAuth();
  return getWikiEntryBySlug(slug);
}

export async function listWikiEntriesAction(params: {
  query?: string;
  kindSlug?: string;
  limit?: number;
  offset?: number;
}) {
  await requireAuth();
  return listWikiEntries(params);
}

export async function listWikiKindSlugsAction() {
  await requireAuth();
  return listWikiKindSlugs();
}
