"use client";

import type {
  AdminUsersListResult,
  ListAdminUsersParams,
} from "@globalscout/shared";
import Link from "next/link";
import { RefreshCw, Users } from "lucide-react";
import { useState } from "react";
import { UsersFilters } from "@/components/admin/users-filters";
import { UsersPagination } from "@/components/admin/users-pagination";
import { UsersTable } from "@/components/admin/users-table";
import { Button } from "@/components/ui/button";
import { DEFAULT_ADMIN_USERS_FILTERS } from "@/features/admin/users/constants";
import {
  useAdminUserMutations,
  useAdminUsersQuery,
} from "@/features/admin/users/use-admin-users";

type UsersPageClientProps = {
  initialData: AdminUsersListResult;
  initialFilters?: ListAdminUsersParams;
  currentUserId: string;
};

export function UsersPageClient({
  initialData,
  initialFilters = DEFAULT_ADMIN_USERS_FILTERS,
  currentUserId,
}: UsersPageClientProps) {
  const [filters, setFilters] =
    useState<ListAdminUsersParams>(initialFilters);

  const { data, isFetching, refetch } = useAdminUsersQuery(filters, {
    initialData,
    initialFilters,
  });
  const { updateStatus, deleteUser, isPending } = useAdminUserMutations();

  const users = data?.users ?? [];
  const pagination = data?.pagination ?? initialData.pagination;

  async function handleBlock(userId: string) {
    await updateStatus.mutateAsync({ userId, status: "BLOCKED" });
  }

  async function handleUnblock(userId: string) {
    await updateStatus.mutateAsync({ userId, status: "ACTIVE" });
  }

  async function handleDelete(userId: string) {
    await deleteUser.mutateAsync(userId);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <Users className="size-4" />
            Admin
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            User management
          </h1>
          <p className="text-muted-foreground">
            Browse registered users, block accounts, or remove users from the
            platform.
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
            render={<Link href="/admin" />}
          >
            Back to overview
          </Button>
        </div>
      </div>

      <UsersFilters
        filters={filters}
        disabled={isFetching}
        onChange={setFilters}
      />

      <section className="space-y-3">
        <UsersTable
          users={users}
          currentUserId={currentUserId}
          disabled={isPending || isFetching}
          onBlock={handleBlock}
          onUnblock={handleUnblock}
          onDelete={handleDelete}
        />
        <UsersPagination
          pagination={pagination}
          disabled={isFetching}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        />
      </section>
    </div>
  );
}
