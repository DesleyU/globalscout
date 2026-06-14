"use client";

import type {
  AdminPlayerClaimsListResult,
  ListAdminPlayerClaimsParams,
} from "@globalscout/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBrowserAdminApi } from "@/lib/api/admin-browser";
import {
  playerClaimsFiltersMatch,
  playerClaimsQueryKeys,
} from "./query-keys";

const adminApi = createBrowserAdminApi();

type UsePlayerClaimsQueryOptions = {
  initialData?: AdminPlayerClaimsListResult;
  initialFilters?: ListAdminPlayerClaimsParams;
};

export function usePlayerClaimsQuery(
  params: ListAdminPlayerClaimsParams,
  options: UsePlayerClaimsQueryOptions = {},
) {
  const useInitialData =
    options.initialData !== undefined &&
    options.initialFilters !== undefined &&
    playerClaimsFiltersMatch(params, options.initialFilters);

  return useQuery({
    queryKey: playerClaimsQueryKeys.list(params),
    queryFn: () => adminApi.listPlayerClaims(params),
    initialData: useInitialData ? options.initialData : undefined,
    staleTime: 0,
    placeholderData: (previous) => previous,
  });
}

export function usePlayerClaimMutations() {
  const queryClient = useQueryClient();

  async function invalidateClaims() {
    await queryClient.invalidateQueries({
      queryKey: playerClaimsQueryKeys.all,
    });
  }

  const approve = useMutation({
    mutationFn: ({
      claimId,
      note,
    }: {
      claimId: string;
      note?: string | null;
    }) => adminApi.approvePlayerClaim(claimId, { note }),
    onSuccess: async () => {
      await invalidateClaims();
      toast.success("Claim approved");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const reject = useMutation({
    mutationFn: ({ claimId, note }: { claimId: string; note: string }) =>
      adminApi.rejectPlayerClaim(claimId, { note }),
    onSuccess: async () => {
      await invalidateClaims();
      toast.success("Claim rejected");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const requestInfo = useMutation({
    mutationFn: ({ claimId, note }: { claimId: string; note: string }) =>
      adminApi.requestPlayerClaimInfo(claimId, { note }),
    onSuccess: async () => {
      await invalidateClaims();
      toast.success("Information request sent");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    approve,
    reject,
    requestInfo,
    isPending:
      approve.isPending || reject.isPending || requestInfo.isPending,
  };
}
