"use client";

import type {
  AdminPlayerClaimsListResult,
  ListAdminPlayerClaimsParams,
} from "@globalscout/shared";
import Link from "next/link";
import { useMemo, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { ClaimDetailPanel } from "@/components/admin/claim-detail-panel";
import { ClaimsFilters } from "@/components/admin/claims-filters";
import { ClaimsPagination } from "@/components/admin/claims-pagination";
import { ClaimsTable } from "@/components/admin/claims-table";
import { Button } from "@/components/ui/button";
import { DEFAULT_PLAYER_CLAIMS_FILTERS } from "@/features/admin/player-claims/constants";
import {
  usePlayerClaimMutations,
  usePlayerClaimsQuery,
} from "@/features/admin/player-claims/use-player-claims";

type PlayerClaimsPageClientProps = {
  initialData: AdminPlayerClaimsListResult;
  initialFilters?: ListAdminPlayerClaimsParams;
};

export function PlayerClaimsPageClient({
  initialData,
  initialFilters = DEFAULT_PLAYER_CLAIMS_FILTERS,
}: PlayerClaimsPageClientProps) {
  const [filters, setFilters] =
    useState<ListAdminPlayerClaimsParams>(initialFilters);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(
    initialData.claims[0]?.claim.id ?? null,
  );

  const { data, isFetching, refetch } = usePlayerClaimsQuery(filters, {
    initialData,
    initialFilters,
  });
  const { approve, reject, requestInfo, isPending } = usePlayerClaimMutations();

  const claims = useMemo(() => data?.claims ?? [], [data?.claims]);
  const pagination = data?.pagination ?? initialData.pagination;

  const activeClaimId = useMemo(() => {
    if (claims.length === 0) {
      return null;
    }

    if (
      selectedClaimId &&
      claims.some((item) => item.claim.id === selectedClaimId)
    ) {
      return selectedClaimId;
    }

    return claims[0]?.claim.id ?? null;
  }, [claims, selectedClaimId]);

  const selectedClaim = useMemo(
    () => claims.find((item) => item.claim.id === activeClaimId) ?? null,
    [claims, activeClaimId],
  );

  async function handleApprove(note?: string | null) {
    if (!activeClaimId) {
      return;
    }

    await approve.mutateAsync({ claimId: activeClaimId, note });
  }

  async function handleReject(note: string) {
    if (!activeClaimId) {
      return;
    }

    await reject.mutateAsync({ claimId: activeClaimId, note });
  }

  async function handleRequestInfo(note: string) {
    if (!activeClaimId) {
      return;
    }

    await requestInfo.mutateAsync({ claimId: activeClaimId, note });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="size-4" />
            Admin
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Player identity claims
          </h1>
          <p className="text-muted-foreground">
            Filter, browse, and review player identity claims across all
            statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw className={isFetching ? "animate-spin" : undefined} />
            Refresh
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            render={<Link href="/dashboard" />}
          >
            Back to dashboard
          </Button>
        </div>
      </div>

      <ClaimsFilters
        filters={filters}
        disabled={isFetching}
        onChange={setFilters}
      />

      <section className="space-y-3">
        <ClaimsTable
          claims={claims}
          selectedClaimId={activeClaimId}
          onSelect={setSelectedClaimId}
        />
        <ClaimsPagination
          pagination={pagination}
          disabled={isFetching}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        />
      </section>

      <section>
        <ClaimDetailPanel
          item={selectedClaim}
          disabled={isPending}
          onApprove={handleApprove}
          onReject={handleReject}
          onRequestInfo={handleRequestInfo}
        />
      </section>
    </div>
  );
}
