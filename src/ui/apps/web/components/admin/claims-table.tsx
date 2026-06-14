"use client";

import type { AdminPendingClaimItem } from "@globalscout/shared";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { ConfidenceScoreBadge } from "@/components/admin/confidence-score-badge";
import { Badge } from "@/components/ui/badge";
import {
  formatClaimStatus,
  formatRelativeTime,
  hasRequestedMoreInfo,
} from "@/features/admin/formatters";
import { cn } from "@/lib/utils";

type ClaimsTableProps = {
  claims: AdminPendingClaimItem[];
  selectedClaimId: string | null;
  onSelect: (claimId: string) => void;
};

export function ClaimsTable({
  claims,
  selectedClaimId,
  onSelect,
}: ClaimsTableProps) {
  const columns = useMemo<ColumnDef<AdminPendingClaimItem>[]>(
    () => [
      {
        id: "player",
        header: "Player",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">
              {row.original.userFullName || row.original.email}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.email}
            </p>
          </div>
        ),
      },
      {
        id: "candidate",
        header: "Candidate",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">
              {row.original.claim.candidateName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.claim.candidateClub}
            </p>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = String(row.original.claim.status);
          const infoRequested = hasRequestedMoreInfo(
            status,
            row.original.claim.adminNote,
          );

          return (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{formatClaimStatus(status)}</Badge>
              {infoRequested ? (
                <Badge variant="outline">Info requested</Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "confidence",
        header: "Match",
        cell: ({ row }) => (
          <ConfidenceScoreBadge score={row.original.claim.confidenceScore} />
        ),
      },
      {
        id: "evidence",
        header: "Evidence",
        cell: ({ row }) => row.original.claim.evidence.length,
      },
      {
        id: "updated",
        header: "Updated",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(row.original.claim.updatedAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: claims,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.claim.id,
  });

  if (claims.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm font-medium">No claims match your filters</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different status or search term.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full min-w-[48rem] border-collapse text-sm">
        <thead className="border-b bg-muted/30">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const isSelected = row.original.claim.id === selectedClaimId;

            return (
              <tr
                key={row.id}
                tabIndex={0}
                onClick={() => onSelect(row.original.claim.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(row.original.claim.id);
                  }
                }}
                className={cn(
                  "cursor-pointer border-b transition-colors last:border-b-0",
                  isSelected
                    ? "bg-primary/5"
                    : "hover:bg-muted/40",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
