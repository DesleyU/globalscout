"use client";

import type {
  CompetitionLevel,
  CompetitionType,
  ListAdminCountryCompetitionsResult,
} from "@/lib/api/reference-data-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBrowserAdminApi } from "@/lib/api/admin-browser";
import { referenceDataCountriesQueryKey } from "@/features/admin/reference-data/use-reference-data-countries";

const adminApi = createBrowserAdminApi();

export function countryCompetitionsQueryKey(countryCode: string) {
  return ["admin", "reference-data", "countries", countryCode, "competitions"] as const;
}

export function useCountryCompetitions(
  countryCode: string,
  initialData?: ListAdminCountryCompetitionsResult,
) {
  return useQuery({
    queryKey: countryCompetitionsQueryKey(countryCode),
    queryFn: () => adminApi.getReferenceDataCountryCompetitions(countryCode),
    initialData,
  });
}

export function useCompetitionReview(countryCode: string) {
  const queryClient = useQueryClient();

  function invalidate() {
    void queryClient.invalidateQueries({
      queryKey: countryCompetitionsQueryKey(countryCode),
    });
    void queryClient.invalidateQueries({
      queryKey: referenceDataCountriesQueryKey,
    });
  }

  const setLevel = useMutation({
    mutationFn: ({
      competitionId,
      level,
    }: {
      competitionId: string;
      level: CompetitionLevel;
    }) => adminApi.setReferenceDataCompetitionLevel(competitionId, { level }),
    onSuccess: () => {
      toast.success("Competition level updated");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const setType = useMutation({
    mutationFn: ({
      competitionId,
      type,
    }: {
      competitionId: string;
      type: CompetitionType;
    }) => adminApi.setReferenceDataCompetitionType(competitionId, { type }),
    onSuccess: () => {
      toast.success("Competition type updated");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const approve = useMutation({
    mutationFn: ({
      competitionId,
      level,
      type,
    }: {
      competitionId: string;
      level: CompetitionLevel;
      type: CompetitionType;
    }) => adminApi.approveReferenceDataCompetition(competitionId, { level, type }),
    onSuccess: () => {
      toast.success("Competition approved");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const reject = useMutation({
    mutationFn: (competitionId: string) => adminApi.rejectReferenceDataCompetition(competitionId),
    onSuccess: () => {
      toast.success("Competition rejected");
      invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return { setLevel, setType, approve, reject };
}
