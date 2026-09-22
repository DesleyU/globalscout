"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { SearchUsersResult } from "@globalscout/shared";

export type PlayersSearchFilters = {
  q: string;
  position: string;
  country: string;
  club: string;
  minAge: string;
  maxAge: string;
};

async function fetchPlayersSearch(
  filters: PlayersSearchFilters,
  page: number,
): Promise<SearchUsersResult> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  params.set("role", "PLAYER");
  if (filters.position) params.set("position", filters.position);
  if (filters.country) params.set("country", filters.country);
  if (filters.club) params.set("club", filters.club);
  if (filters.minAge) params.set("minAge", filters.minAge);
  if (filters.maxAge) params.set("maxAge", filters.maxAge);
  params.set("page", String(page));

  const response = await fetch(`/api/users/search?${params.toString()}`, {
    credentials: "include",
  });
  const data = (await response.json()) as SearchUsersResult & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Search failed");
  }

  return data;
}

/**
 * Search for players, keyed by filters so returning to a previous search (e.g. via browser
 * Back from a profile page) restores results - including any pages already loaded via
 * "Load more" - from cache instead of re-fetching from page 1.
 */
export function usePlayersSearch(filters: PlayersSearchFilters, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["users-search", filters],
    queryFn: ({ pageParam }) => fetchPlayersSearch(filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.pages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled,
  });
}
