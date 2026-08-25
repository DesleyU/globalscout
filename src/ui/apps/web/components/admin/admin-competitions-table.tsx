"use client";

import type {
  AdminFootballCompetition,
  CompetitionLevel,
  CompetitionType,
} from "@/lib/api/reference-data-types";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CompetitionLevelSelectItems,
  CompetitionLevelSelectValueLabel,
} from "@/components/reference-data/competition-level-select-items";
import {
  CompetitionTypeSelectItems,
  CompetitionTypeSelectValueLabel,
} from "@/components/reference-data/competition-type-select-items";
import {
  formatCompetitionLevel,
  formatCompetitionLevelDescription,
} from "@/lib/reference-data/competition-levels";
import {
  formatCompetitionType,
  formatCompetitionTypeDescription,
} from "@/lib/reference-data/competition-types";
import { useCompetitionReview } from "@/features/admin/reference-data/use-competition-review";

type CompetitionFilter = "all" | "needsLevel" | "pending" | "rejected";

type AdminCompetitionsTableProps = {
  countryCode: string;
  competitions: AdminFootballCompetition[];
  filter: CompetitionFilter;
  disabled?: boolean;
};

function formatSource(source: AdminFootballCompetition["source"]): string {
  switch (source) {
    case "Provider":
      return "Provider";
    case "UserSubmitted":
      return "User submitted";
    case "AdminCurated":
      return "Admin curated";
    default:
      return source;
  }
}

function formatStatus(status: AdminFootballCompetition["status"]): string {
  switch (status) {
    case "Approved":
      return "Approved";
    case "Pending":
      return "Pending";
    case "Rejected":
      return "Rejected";
    case "Merged":
      return "Merged";
    default:
      return status;
  }
}

function statusVariant(status: AdminFootballCompetition["status"]) {
  switch (status) {
    case "Approved":
      return "secondary" as const;
    case "Pending":
      return "outline" as const;
    case "Rejected":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function matchesFilter(competition: AdminFootballCompetition, filter: CompetitionFilter): boolean {
  switch (filter) {
    case "needsLevel":
      return competition.level === "Unknown";
    case "pending":
      return competition.status === "Pending";
    case "rejected":
      return competition.status === "Rejected";
    default:
      return true;
  }
}

function resolveCompetitionType(competition: AdminFootballCompetition): string {
  return competition.type ?? competition.submittedTypeHint ?? "Unknown";
}

export function AdminCompetitionsTable({
  countryCode,
  competitions,
  filter,
  disabled = false,
}: AdminCompetitionsTableProps) {
  const { setLevel, setType, approve, reject } = useCompetitionReview(countryCode);
  const [approveTarget, setApproveTarget] = useState<AdminFootballCompetition | null>(
    null,
  );
  const [approveLevel, setApproveLevel] = useState<CompetitionLevel>("Amateur");
  const [approveType, setApproveType] = useState<CompetitionType>("League");
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredCompetitions = useMemo(
    () => competitions.filter((competition) => matchesFilter(competition, filter)),
    [competitions, filter],
  );

  const isBusy =
    disabled ||
    setLevel.isPending ||
    setType.isPending ||
    approve.isPending ||
    reject.isPending;

  const columns = useMemo<ColumnDef<AdminFootballCompetition>[]>(
    () => [
      {
        id: "league",
        header: "Competition",
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            {row.original.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.original.logoUrl}
                alt=""
                className="size-8 shrink-0 rounded-sm object-cover"
              />
            ) : (
              <span
                className="size-8 shrink-0 rounded-sm bg-muted"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0">
              <p className="truncate font-medium">{row.original.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {formatCompetitionType(resolveCompetitionType(row.original))}
                {row.original.externalCompetitionId
                  ? ` · API #${row.original.externalCompetitionId}`
                  : ""}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "sourceStatus",
        header: "Source / status",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline">{formatSource(row.original.source)}</Badge>
            <Badge variant={statusVariant(row.original.status)}>
              {formatStatus(row.original.status)}
            </Badge>
          </div>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => {
          const competition = row.original;
          const currentType = resolveCompetitionType(competition);
          const hint = competition.submittedTypeHint;

          return (
            <div className="space-y-1">
              <Select
                value={currentType}
                disabled={isBusy || competition.status === "Rejected"}
                onValueChange={(value) => {
                  if (!value || value === "Unknown" || value === currentType) {
                    return;
                  }

                  setType.mutate({
                    competitionId: competition.id,
                    type: value as CompetitionType,
                  });
                }}
              >
                <SelectTrigger size="sm" className="w-full min-w-36">
                  <SelectValue>
                    <CompetitionTypeSelectValueLabel
                      type={currentType}
                      placeholder="Needs type"
                    />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <CompetitionTypeSelectItems includeUnknown />
                </SelectContent>
              </Select>
              {hint && !competition.type ? (
                <div className="text-xs text-muted-foreground">
                  <p>Player hint: {formatCompetitionType(hint)}</p>
                  {formatCompetitionTypeDescription(hint) ? (
                    <p>{formatCompetitionTypeDescription(hint)}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "level",
        header: "Level",
        cell: ({ row }) => {
          const competition = row.original;
          const hint = competition.submittedLevelHint;

          return (
            <div className="space-y-1">
              <Select
                value={competition.level}
                disabled={isBusy || competition.status === "Rejected"}
                onValueChange={(value) => {
                  if (!value || value === competition.level) {
                    return;
                  }

                  setLevel.mutate({
                    competitionId: competition.id,
                    level: value as CompetitionLevel,
                  });
                }}
              >
                <SelectTrigger size="sm" className="w-full min-w-52">
                  <SelectValue>
                    <CompetitionLevelSelectValueLabel
                      level={competition.level}
                      placeholder="Needs level"
                    />
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <CompetitionLevelSelectItems includeUnknown />
                </SelectContent>
              </Select>
              {hint && competition.level === "Unknown" ? (
                <div className="text-xs text-muted-foreground">
                  <p>Player hint: {formatCompetitionLevel(hint)}</p>
                  {formatCompetitionLevelDescription(hint) ? (
                    <p>{formatCompetitionLevelDescription(hint)}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const competition = row.original;

          if (competition.status !== "Pending") {
            return (
              <span className="text-xs text-muted-foreground">—</span>
            );
          }

          return (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => {
                  setApproveTarget(competition);
                  setApproveLevel(
                    competition.submittedLevelHint &&
                      competition.submittedLevelHint !== "Unknown"
                      ? competition.submittedLevelHint
                      : competition.level !== "Unknown"
                        ? competition.level
                        : "Amateur",
                  );
                  setApproveType(
                    competition.submittedTypeHint ??
                      (competition.type === "Cup" ? "Cup" : "League"),
                  );
                }}
              >
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-destructive"
                disabled={isBusy}
                onClick={() => setRejectTargetId(competition.id)}
              >
                Reject
              </Button>
            </div>
          );
        },
      },
    ],
    [isBusy, setLevel, setType],
  );

  const table = useReactTable({
    data: filteredCompetitions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  if (filteredCompetitions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm font-medium">No competitions match this filter</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Sync the country or try a different filter.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <thead className="border-b bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground last:text-right"
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
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b transition-colors last:border-b-0 hover:bg-muted/20"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-top last:text-right">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {approveTarget && mounted
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md space-y-4 rounded-xl border bg-background p-6 shadow-xl">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">
                    Approve {approveTarget.name}?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Choose the competition level and type before approving this
                    user submission.
                  </p>
                </div>
                <Select
                  value={approveType}
                  onValueChange={(value) => {
                    if (value) {
                      setApproveType(value as CompetitionType);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <CompetitionTypeSelectValueLabel type={approveType} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <CompetitionTypeSelectItems />
                  </SelectContent>
                </Select>
                {formatCompetitionTypeDescription(approveType) ? (
                  <p className="text-sm text-muted-foreground">
                    {formatCompetitionTypeDescription(approveType)}
                  </p>
                ) : null}
                <Select
                  value={approveLevel}
                  onValueChange={(value) => {
                    if (value) {
                      setApproveLevel(value as CompetitionLevel);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <CompetitionLevelSelectValueLabel level={approveLevel} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <CompetitionLevelSelectItems />
                  </SelectContent>
                </Select>
                {formatCompetitionLevelDescription(approveLevel) ? (
                  <p className="text-sm text-muted-foreground">
                    {formatCompetitionLevelDescription(approveLevel)}
                  </p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={approve.isPending}
                    onClick={() => setApproveTarget(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={approve.isPending}
                    onClick={() => {
                      void approve
                        .mutateAsync({
                          competitionId: approveTarget.id,
                          level: approveLevel,
                          type: approveType,
                        })
                        .then(() => setApproveTarget(null));
                    }}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <ConfirmDialog
        open={rejectTargetId !== null}
        title="Reject this competition?"
        description="Rejected competitions are hidden from player search and pickers."
        confirmLabel="Reject"
        destructive
        loading={reject.isPending}
        onCancel={() => setRejectTargetId(null)}
        onConfirm={() => {
          if (!rejectTargetId) {
            return;
          }

          void reject.mutateAsync(rejectTargetId).then(() => setRejectTargetId(null));
        }}
      />
    </>
  );
}

export type { CompetitionFilter };
