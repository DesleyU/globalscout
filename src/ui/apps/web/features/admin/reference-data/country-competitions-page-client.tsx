"use client";

import type {
  AdminReferenceDataCountry,
  ListAdminCountryCompetitionsResult,
} from "@/lib/api/reference-data-types";
import { Globe, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AdminCompetitionsTable,
  type CompetitionFilter,
} from "@/components/admin/admin-competitions-table";
import { CountrySyncRowActions } from "@/components/admin/country-sync-row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCountryCompetitions } from "@/features/admin/reference-data/use-competition-review";
import { useReferenceDataSync } from "@/features/admin/reference-data/use-reference-data-sync";

type CountryCompetitionsPageClientProps = {
  country: AdminReferenceDataCountry;
  initialData: ListAdminCountryCompetitionsResult;
};

function matchesSearch(name: string, search: string) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return name.toLowerCase().includes(normalized);
}

export function CountryCompetitionsPageClient({
  country,
  initialData,
}: CountryCompetitionsPageClientProps) {
  const countryCode = country.code?.trim() ?? "";
  const [search, setSearch] = useState("");
  const [competitionFilter, setCompetitionFilter] = useState<CompetitionFilter>("all");
  const [syncing, setSyncing] = useState(false);

  const competitionsQuery = useCountryCompetitions(countryCode, initialData);
  const syncMutation = useReferenceDataSync();

  const competitions =
    competitionsQuery.data?.competitions ?? initialData.competitions;

  const filteredCount = useMemo(
    () =>
      competitions.filter((competition) => {
        if (!matchesSearch(competition.name, search)) {
          return false;
        }

        switch (competitionFilter) {
          case "needsLevel":
            return competition.level === "Unknown";
          case "pending":
            return competition.status === "Pending";
          case "rejected":
            return competition.status === "Rejected";
          default:
            return true;
        }
      }).length,
    [competitions, search, competitionFilter],
  );

  async function handleSync() {
    if (!countryCode) {
      return;
    }

    setSyncing(true);
    try {
      await syncMutation.mutateAsync(countryCode);
      await competitionsQuery.refetch();
    } finally {
      setSyncing(false);
    }
  }

  const filterOptions: { value: CompetitionFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "needsLevel", label: "Needs level" },
    { value: "pending", label: "Pending approval" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            <Globe className="size-4" />
            Admin
          </div>
          <div className="flex items-center gap-3">
            {country.flagUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={country.flagUrl}
                alt=""
                className="size-8 rounded-sm object-cover"
              />
            ) : null}
            <h1 className="text-3xl font-semibold tracking-tight">
              {country.name}
            </h1>
          </div>
          <p className="max-w-2xl text-muted-foreground">
            Review synced competitions, set levels for provider imports, and
            approve or reject player-submitted competitions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            render={<Link href="/admin/reference-data" />}
          >
            Back to countries
          </Button>
          {countryCode ? (
            <CountrySyncRowActions
              country={country}
              disabled={syncMutation.isPending}
              syncing={syncing}
              onSync={handleSync}
            />
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Competitions in catalog</p>
          <p className="mt-1 text-2xl font-semibold">{country.competitionCount}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Need level</p>
          <p className="mt-1 text-2xl font-semibold">
            {country.competitionsNeedingLevelCount}
          </p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Pending approval</p>
          <p className="mt-1 text-2xl font-semibold">
            {country.pendingCompetitionCount}
          </p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Teams synced</p>
          <p className="mt-1 text-2xl font-semibold">{country.teamCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="grid min-w-64 flex-1 gap-1.5">
          <label
            htmlFor="country-competition-search"
            className="text-xs font-medium leading-none text-muted-foreground"
          >
            Search competitions
          </label>
          <Input
            id="country-competition-search"
            value={search}
            placeholder="Competition name..."
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-8"
          disabled={competitionsQuery.isFetching}
          onClick={() => void competitionsQuery.refetch()}
        >
          <RefreshCw
            className={competitionsQuery.isFetching ? "size-4 animate-spin" : "size-4"}
          />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={competitionFilter === option.value ? "default" : "outline"}
            onClick={() => setCompetitionFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <section className="space-y-3">
        {competitionsQuery.isError ? (
          <p className="text-sm text-destructive">
            {competitionsQuery.error.message}
          </p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Showing {filteredCount} of {competitions.length} competitions
        </p>
        <AdminCompetitionsTable
          countryCode={countryCode}
          competitions={competitions.filter((competition) =>
            matchesSearch(competition.name, search),
          )}
          filter={competitionFilter}
          disabled={competitionsQuery.isFetching || syncMutation.isPending}
        />
      </section>
    </div>
  );
}
