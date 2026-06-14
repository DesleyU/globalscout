"use client";

import type { AdminPendingClaimItem } from "@globalscout/shared";
import { cn } from "@/lib/utils";
import { ConfidenceScoreBadge } from "@/components/admin/confidence-score-badge";
import {
  formatClaimStatus,
  formatRelativeTime,
  hasRequestedMoreInfo,
} from "@/features/admin/formatters";

type ClaimsQueueProps = {
  claims: AdminPendingClaimItem[];
  selectedClaimId: string | null;
  onSelect: (claimId: string) => void;
};

export function ClaimsQueue({
  claims,
  selectedClaimId,
  onSelect,
}: ClaimsQueueProps) {
  if (claims.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm font-medium">No pending claims</p>
        <p className="mt-1 text-sm text-muted-foreground">
          New player verification requests will appear here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {claims.map((item) => {
        const isSelected = item.claim.id === selectedClaimId;

        return (
          <li key={item.claim.id}>
            <button
              type="button"
              onClick={() => onSelect(item.claim.id)}
              className={cn(
                "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "hover:border-foreground/20 hover:bg-muted/40",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-semibold">
                    {item.userFullName || item.email}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.claim.candidateName} · {item.claim.candidateClub}
                  </p>
                </div>
                <ConfidenceScoreBadge score={item.claim.confidenceScore} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{formatClaimStatus(String(item.claim.status))}</span>
                {hasRequestedMoreInfo(
                  String(item.claim.status),
                  item.claim.adminNote,
                ) ? (
                  <>
                    <span>·</span>
                    <span>Info requested</span>
                  </>
                ) : null}
                <span>·</span>
                <span>{formatRelativeTime(item.claim.updatedAt)}</span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
