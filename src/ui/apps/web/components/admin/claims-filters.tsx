"use client";

import type { ListAdminPlayerClaimsParams } from "@globalscout/shared";
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
  fromClaimStatusFilter,
  PLAYER_CLAIM_STATUS_FILTER_OPTIONS,
  PLAYER_CLAIMS_PAGE_SIZE_OPTIONS,
  toClaimStatusFilter,
} from "@/features/admin/player-claims/constants";

type ClaimsFiltersProps = {
  filters: ListAdminPlayerClaimsParams;
  disabled?: boolean;
  onChange: (filters: ListAdminPlayerClaimsParams) => void;
};

const filterLabelClassName =
  "text-xs font-medium leading-none text-muted-foreground";

export function ClaimsFilters({
  filters,
  disabled = false,
  onChange,
}: ClaimsFiltersProps) {
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
        <label htmlFor="claims-status-filter" className={filterLabelClassName}>
          Status
        </label>
        <Select
          value={fromClaimStatusFilter(filters.status)}
          onValueChange={(value) =>
            onChange({
              ...filters,
              status: toClaimStatusFilter(value),
              page: 1,
            })
          }
          disabled={disabled}
        >
          <SelectTrigger id="claims-status-filter" className="w-full sm:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {PLAYER_CLAIM_STATUS_FILTER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
        <div className="grid min-w-64 flex-1 gap-1.5">
          <label htmlFor="claims-search-filter" className={filterLabelClassName}>
            Search
          </label>
          <Input
            id="claims-search-filter"
            value={searchDraft}
            disabled={disabled}
            placeholder="Email, name, or candidate..."
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
        <label htmlFor="claims-page-size" className={filterLabelClassName}>
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
          <SelectTrigger id="claims-page-size" className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAYER_CLAIMS_PAGE_SIZE_OPTIONS.map((size) => (
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
