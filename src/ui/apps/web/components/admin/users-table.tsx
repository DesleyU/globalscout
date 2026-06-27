"use client";

import type { AdminUserListItem } from "@globalscout/shared";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { Badge } from "@/components/ui/badge";
import {
  formatRelativeTime,
  formatUserRole,
  formatUserStatus,
} from "@/features/admin/formatters";

type UsersTableProps = {
  users: AdminUserListItem[];
  currentUserId: string;
  disabled?: boolean;
  onBlock: (userId: string) => Promise<void>;
  onUnblock: (userId: string) => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
};

function getUserDisplayName(user: AdminUserListItem): string {
  const firstName = user.profile?.firstName?.trim() ?? "";
  const lastName = user.profile?.lastName?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return fullName || user.email;
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toUpperCase()) {
    case "BLOCKED":
      return "destructive";
    case "PENDING":
      return "outline";
    default:
      return "secondary";
  }
}

export function UsersTable({
  users,
  currentUserId,
  disabled = false,
  onBlock,
  onUnblock,
  onDelete,
}: UsersTableProps) {
  const columns = useMemo<ColumnDef<AdminUserListItem>[]>(
    () => [
      {
        id: "user",
        header: "User",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">
              {getUserDisplayName(row.original)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.email}
            </p>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant="outline">
            {formatUserRole(row.original.role)}
          </Badge>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={getStatusVariant(row.original.status)}>
            {formatUserStatus(row.original.status)}
          </Badge>
        ),
      },
      {
        id: "connections",
        header: "Connections",
        cell: ({ row }) => row.original.connectionCount,
      },
      {
        id: "created",
        header: "Created",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRelativeTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <UserRowActions
            user={row.original}
            currentUserId={currentUserId}
            disabled={disabled}
            onBlock={onBlock}
            onUnblock={onUnblock}
            onDelete={onDelete}
          />
        ),
      },
    ],
    [currentUserId, disabled, onBlock, onDelete, onUnblock],
  );

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm font-medium">No users match your filters</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Try a different role, status, or search term.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full min-w-[56rem] border-collapse text-sm">
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
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b transition-colors last:border-b-0 hover:bg-muted/20"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 align-top">
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
