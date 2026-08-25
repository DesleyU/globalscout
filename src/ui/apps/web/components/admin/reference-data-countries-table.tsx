"use client";

import type { AdminReferenceDataCountry } from "@/lib/api/reference-data-types";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";
import { CountrySyncRowActions } from "@/components/admin/country-sync-row-actions";
import { Badge } from "@/components/ui/badge";

type ReferenceDataCountriesTableProps = {
  countries: AdminReferenceDataCountry[];
  disabled?: boolean;
  syncingCountryCode?: string | null;
  onSync: (countryCode: string) => Promise<void>;
};

export function ReferenceDataCountriesTable({
  countries,
  disabled = false,
  syncingCountryCode = null,
  onSync,
}: ReferenceDataCountriesTableProps) {
  const columns = useMemo<ColumnDef<AdminReferenceDataCountry>[]>(
    () => [
      {
        id: "country",
        header: "Country",
        cell: ({ row }) => {
          const code = row.original.code?.trim();
          const href = code
            ? `/admin/reference-data/${encodeURIComponent(code)}`
            : undefined;

          const content = (
            <div className="flex min-w-0 items-center gap-3">
              {row.original.flagUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.original.flagUrl}
                  alt=""
                  className="size-6 shrink-0 rounded-sm object-cover"
                />
              ) : (
                <span
                  className="size-6 shrink-0 rounded-sm bg-muted"
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{row.original.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.original.code ?? "—"}
                </p>
              </div>
            </div>
          );

          if (!href) {
            return content;
          }

          return (
            <Link
              href={href}
              className="block rounded-md transition-colors hover:bg-muted/40 -mx-2 px-2 py-1"
            >
              {content}
            </Link>
          );
        },
      },
      {
        id: "competitions",
        header: "Competitions",
        cell: ({ row }) => {
          const { competitionCount, competitionsNeedingLevelCount, pendingCompetitionCount } =
            row.original;

          return (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm">{competitionCount}</span>
              {competitionsNeedingLevelCount > 0 ? (
                <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">
                  {competitionsNeedingLevelCount} need level
                </Badge>
              ) : null}
              {pendingCompetitionCount > 0 ? (
                <Badge variant="outline" className="border-sky-500/40 text-sky-700 dark:text-sky-400">
                  {pendingCompetitionCount} pending
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "teams",
        header: "Teams",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.teamCount > 0 ? row.original.teamCount : "—"}
          </span>
        ),
      },
      {
        id: "lastSync",
        header: "Last sync",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.lastSyncedAt
              ? new Date(row.original.lastSyncedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const code = row.original.code?.trim();

          return (
            <CountrySyncRowActions
              country={row.original}
              disabled={disabled}
              syncing={syncingCountryCode === code}
              onSync={onSync}
            />
          );
        },
      },
    ],
    [disabled, onSync, syncingCountryCode],
  );

  const table = useReactTable({
    data: countries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.code ?? row.name,
  });

  if (countries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm font-medium">No countries match your filters</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different country name, code, or sync filter.
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
  );
}
