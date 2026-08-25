"use client";

import { Globe, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ReferenceDataCountriesTable } from "@/components/admin/reference-data-countries-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminReferenceDataCountry } from "@/lib/api/reference-data-types";
import { useReferenceDataCountries } from "@/features/admin/reference-data/use-reference-data-countries";
import { useReferenceDataSync } from "@/features/admin/reference-data/use-reference-data-sync";

type SyncFilter = "all" | "synced" | "unsynced";

function matchesSearch(country: AdminReferenceDataCountry, search: string) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return (
    country.name.toLowerCase().includes(normalized) ||
    (country.code?.toLowerCase().includes(normalized) ?? false)
  );
}

function matchesSyncFilter(country: AdminReferenceDataCountry, filter: SyncFilter) {
  if (filter === "all") {
    return true;
  }

  const isSynced = Boolean(country.lastSyncedAt);
  return filter === "synced" ? isSynced : !isSynced;
}

export function ReferenceDataPageClient() {
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [syncFilter, setSyncFilter] = useState<SyncFilter>("all");
  const [syncingCountryCode, setSyncingCountryCode] = useState<string | null>(
    null,
  );

  const countriesQuery = useReferenceDataCountries();
  const syncMutation = useReferenceDataSync();

  const countries = useMemo(() => {
    const source = countriesQuery.data?.countries ?? [];

    return [...source]
      .filter(
        (country) =>
          matchesSearch(country, search) && matchesSyncFilter(country, syncFilter),
      )
      .sort((left, right) => {
        const leftSynced = Boolean(left.lastSyncedAt);
        const rightSynced = Boolean(right.lastSyncedAt);
        if (leftSynced !== rightSynced) {
          return leftSynced ? -1 : 1;
        }

        return left.name.localeCompare(right.name);
      });
  }, [countriesQuery.data?.countries, search, syncFilter]);

  async function handleSync(countryCode: string) {
    setSyncingCountryCode(countryCode);
    try {
      await syncMutation.mutateAsync(countryCode);
    } finally {
      setSyncingCountryCode(null);
    }
  }

  function applySearch() {
    setSearch(searchDraft.trim());
  }

  const totalCount = countriesQuery.data?.countries.length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <Globe className="size-4" />
            Admin
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Reference data
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Sync competitions and teams from API-Football, then review competition
            levels and approve player-submitted competitions for each country.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          render={<Link href="/admin" />}
        >
          Back to overview
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="grid min-w-64 flex-1 gap-1.5">
          <label
            htmlFor="reference-data-country-search"
            className="text-xs font-medium leading-none text-muted-foreground"
          >
            Search countries
          </label>
          <Input
            id="reference-data-country-search"
            value={searchDraft}
            placeholder="Country name or code..."
            disabled={syncMutation.isPending || countriesQuery.isLoading}
            onChange={(event) => setSearchDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applySearch();
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-8"
          disabled={syncMutation.isPending || countriesQuery.isLoading}
          onClick={applySearch}
        >
          <Search className="size-4" />
          Search
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { value: "all", label: "All countries" },
            { value: "synced", label: "Synced" },
            { value: "unsynced", label: "Not synced" },
          ] as const
        ).map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={syncFilter === option.value ? "default" : "outline"}
            onClick={() => setSyncFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <section className="space-y-3">
        {countriesQuery.isError ? (
          <p className="text-sm text-destructive">
            {countriesQuery.error.message}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Showing {countries.length} of {totalCount} countries
        </p>
        <ReferenceDataCountriesTable
          countries={countries}
          disabled={syncMutation.isPending || countriesQuery.isLoading}
          syncingCountryCode={syncingCountryCode}
          onSync={handleSync}
        />
      </section>
    </div>
  );
}
