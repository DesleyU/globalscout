"use client";

import type { SyncCountryReferenceDataResult } from "@globalscout/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBrowserAdminApi } from "@/lib/api/admin-browser";
import { referenceDataCountriesQueryKey } from "@/features/admin/reference-data/use-reference-data-countries";

const adminApi = createBrowserAdminApi();

function formatSyncSummary(result: SyncCountryReferenceDataResult): string {
  const { competitions, teams } = result;
  return `${result.countryName}: ${competitions.fetched} competitions (${competitions.added} new, ${competitions.updated} updated), ${teams.fetched} teams (${teams.added} new, ${teams.updated} updated)`;
}

export function useReferenceDataSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (countryCode: string) =>
      adminApi.syncCountryReferenceData(countryCode),
    onSuccess: (result) => {
      toast.success("Country sync completed", {
        description: formatSyncSummary(result),
      });
      void queryClient.invalidateQueries({
        queryKey: referenceDataCountriesQueryKey,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
