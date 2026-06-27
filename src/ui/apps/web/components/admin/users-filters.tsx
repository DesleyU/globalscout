"use client";

import type { ListAdminUsersParams } from "@globalscout/shared";
import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ADMIN_USER_ROLE_FILTER_OPTIONS,
  ADMIN_USER_STATUS_FILTER_OPTIONS,
  ADMIN_USERS_PAGE_SIZE_OPTIONS,
  fromUserRoleFilter,
  fromUserStatusFilter,
  toUserRoleFilter,
  toUserStatusFilter,
} from "@/features/admin/users/constants";

type UsersFiltersProps = {
  filters: ListAdminUsersParams;
  disabled?: boolean;
  onChange: (filters: ListAdminUsersParams) => void;
};

const filterLabelClassName =
  "text-xs font-medium leading-none text-muted-foreground";

export function UsersFilters({
  filters,
  disabled = false,
  onChange,
}: UsersFiltersProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search ?? "");

  function applySearch() {
    onChange({
      ...filters,
      search: searchDraft.trim() || undefined,
      page: 1,
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="grid w-full min-w-48 gap-1.5 sm:w-auto">
        <label htmlFor="users-role-filter" className={filterLabelClassName}>
          Role
        </label>
        <Select
          value={fromUserRoleFilter(filters.role)}
          onValueChange={(value) =>
            onChange({
              ...filters,
              role: toUserRoleFilter(value),
              page: 1,
            })
          }
          disabled={disabled}
        >
          <SelectTrigger id="users-role-filter" className="w-full sm:w-48">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            {ADMIN_USER_ROLE_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid w-full min-w-48 gap-1.5 sm:w-auto">
        <label htmlFor="users-status-filter" className={filterLabelClassName}>
          Status
        </label>
        <Select
          value={fromUserStatusFilter(filters.status)}
          onValueChange={(value) =>
            onChange({
              ...filters,
              status: toUserStatusFilter(value),
              page: 1,
            })
          }
          disabled={disabled}
        >
          <SelectTrigger id="users-status-filter" className="w-full sm:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {ADMIN_USER_STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
        <div className="grid min-w-64 flex-1 gap-1.5">
          <label htmlFor="users-search-filter" className={filterLabelClassName}>
            Search
          </label>
          <Input
            id="users-search-filter"
            value={searchDraft}
            disabled={disabled}
            placeholder="Email or name..."
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applySearch();
              }
            }}
          />
        </div>

        <div className="grid gap-1.5">
          <span className={filterLabelClassName} aria-hidden="true">
            &nbsp;
          </span>
          <Button
            type="button"
            variant="outline"
            className="h-8"
            disabled={disabled}
            onClick={applySearch}
          >
            <Search className="size-4" />
            Search
          </Button>
        </div>
      </div>

      <div className="grid w-full min-w-36 gap-1.5 sm:w-auto">
        <label htmlFor="users-page-size" className={filterLabelClassName}>
          Page size
        </label>
        <Select
          value={String(filters.limit ?? 20)}
          onValueChange={(value) =>
            onChange({
              ...filters,
              limit: Number(value),
              page: 1,
            })
          }
          disabled={disabled}
        >
          <SelectTrigger id="users-page-size" className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ADMIN_USERS_PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
