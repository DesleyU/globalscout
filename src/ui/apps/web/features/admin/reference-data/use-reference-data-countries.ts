"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createBrowserAdminApi } from "@/lib/api/admin-browser";

const adminApi = createBrowserAdminApi();

export const referenceDataCountriesQueryKey = ["admin", "reference-data", "countries"] as const;

export function useReferenceDataCountries() {
  return useQuery({
    queryKey: referenceDataCountriesQueryKey,
    queryFn: () => adminApi.getReferenceDataCountries(),
  });
}

export function useReferenceDataCountriesQueryClient() {
  return useQueryClient();
}
