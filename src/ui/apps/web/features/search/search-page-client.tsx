"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClubNameAutocompleteField } from "@/components/reference-data/club-name-autocomplete-field";
import { CountryAutocompleteField } from "@/components/reference-data/country-autocomplete-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SidebarVariant } from "@/components/layout/app-sidebar";
import { ONBOARDING_POSITIONS } from "@/features/onboarding/player/constants";
import { useConnectionStates } from "@/features/connections/use-connection-states";
import { usePlayersSearch, type PlayersSearchFilters } from "@/features/search/use-players-search";

const filterLabelClassName = "text-xs font-medium leading-none text-muted-foreground";

type SearchPageClientProps = {
  currentUserId: string;
  variant?: SidebarVariant;
};

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function SearchPageClient({ currentUserId, variant = "player" }: SearchPageClientProps) {
  const isAgent = variant === "agent";
  const networkHref = isAgent ? "/agent/connections" : "/connections";
  const profileHref = isAgent ? "/agent/users" : "/users";

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the source of truth for the *applied* search - restored as-is on browser
  // Back/Forward (e.g. from a profile page) instead of resetting to a blank search page.
  const hasSearched = searchParams.has("q");
  const appliedFilters: PlayersSearchFilters = {
    q: searchParams.get("q") ?? "",
    position: searchParams.get("position") ?? "",
    country: searchParams.get("country") ?? "",
    club: searchParams.get("club") ?? "",
    minAge: searchParams.get("minAge") ?? "",
    maxAge: searchParams.get("maxAge") ?? "",
  };

  // Draft values for the inputs - only become the applied search (and hit the URL) on submit.
  const [query, setQuery] = useState(appliedFilters.q);
  const [position, setPosition] = useState(appliedFilters.position);
  const [country, setCountry] = useState(appliedFilters.country);
  const [club, setClub] = useState(appliedFilters.club);
  const [minAge, setMinAge] = useState(appliedFilters.minAge);
  const [maxAge, setMaxAge] = useState(appliedFilters.maxAge);

  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [connectionStates, setConnectionStates] = useConnectionStates();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePlayersSearch(appliedFilters, hasSearched);

  const results = data?.pages.flatMap((p) => p.users) ?? [];
  const pagination = data?.pages.at(-1)?.pagination ?? null;

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();

    const params = new URLSearchParams();
    params.set("q", query);
    if (isAgent) {
      if (position) params.set("position", position);
      if (country) params.set("country", country);
      if (club) params.set("club", club);
      if (minAge) params.set("minAge", minAge);
      if (maxAge) params.set("maxAge", maxAge);
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  async function handleConnect(userId: string) {
    setPendingIds((prev) => new Set(prev).add(userId));

    try {
      const response = await fetch("/api/connections/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ receiverId: userId }),
      });
      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        toast.error(data.error ?? data.message ?? "Could not send connection request");
        return;
      }

      toast.success("Connection request sent");
      setConnectionStates((prev) => new Map(prev).set(userId, "pending-sent"));
    } catch {
      toast.error("Could not send connection request");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  }

  return (
    <div className={`mx-auto flex flex-col gap-4 p-8 ${isAgent ? "max-w-3xl" : "max-w-2xl"}`}>
      <h1 className="text-xl font-semibold text-gray-900">Search players</h1>

      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players by name..."
            aria-label="Search users"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>

        {isAgent ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid min-w-40 gap-1.5">
              <label htmlFor="search-position" className={filterLabelClassName}>
                Position
              </label>
              <Select
                value={position || "ANY"}
                onValueChange={(value) => setPosition(value === "ANY" ? "" : (value ?? ""))}
              >
                <SelectTrigger id="search-position" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANY">Any position</SelectItem>
                  {ONBOARDING_POSITIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid min-w-36 gap-1.5">
              <label htmlFor="search-country" className={filterLabelClassName}>
                Country
              </label>
              <CountryAutocompleteField
                inputId="search-country"
                value={country}
                onChange={setCountry}
                placeholder="Any country"
              />
            </div>

            <div className="grid min-w-36 gap-1.5">
              <label htmlFor="search-club" className={filterLabelClassName}>
                Club
              </label>
              <ClubNameAutocompleteField
                inputId="search-club"
                country={country}
                value={club}
                onChange={setClub}
              />
            </div>

            <div className="grid w-20 gap-1.5">
              <label htmlFor="search-min-age" className={filterLabelClassName}>
                Min age
              </label>
              <Input
                id="search-min-age"
                type="number"
                min={0}
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
              />
            </div>

            <div className="grid w-20 gap-1.5">
              <label htmlFor="search-max-age" className={filterLabelClassName}>
                Max age
              </label>
              <Input
                id="search-max-age"
                type="number"
                min={0}
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
              />
            </div>
          </div>
        ) : null}
      </form>

      <div className="flex flex-col gap-2">
        {!hasSearched ? (
          <p className="text-sm text-gray-500">
            {isAgent
              ? "Enter a name or use the filters above to find players."
              : "Enter a name to find players."}
          </p>
        ) : null}

        {isLoading
          ? Array.from({ length: 3 }, (_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3">
                  <div className="size-10 animate-pulse rounded-full bg-gray-200" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="h-2.5 w-48 animate-pulse rounded bg-gray-200" />
                  </div>
                </CardContent>
              </Card>
            ))
          : null}

        {hasSearched && !isLoading && results.length === 0 ? (
          <p className="text-sm text-gray-500">No players match these filters.</p>
        ) : null}

        {!isLoading && results.length > 0 && pagination ? (
          <p className="text-xs text-gray-500">
            Showing {results.length} of {pagination.total} player{pagination.total === 1 ? "" : "s"}
          </p>
        ) : null}

        {!isLoading && results.map((user) => {
          const profile = user.profile;
          const name = profile ? `${profile.firstName} ${profile.lastName}` : "Unknown user";
          const isSelf = user.id === currentUserId;
          const state = connectionStates.get(user.id);
          const isPending = pendingIds.has(user.id);
          const meta = [
            profile?.position
              ? (ONBOARDING_POSITIONS.find((p) => p.value === profile.position)?.label ??
                profile.position)
              : null,
            profile?.clubName,
            profile?.country,
            profile?.age ? `Age ${profile.age}` : null,
          ].filter(Boolean);

          return (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between gap-3">
                <Link href={`${profileHref}/${user.id}`} className="flex min-w-0 items-center gap-3">
                  <Avatar>
                    {profile?.avatar ? <AvatarImage src={profile.avatar} alt={name} /> : null}
                    <AvatarFallback>
                      {profile ? getInitials(profile.firstName, profile.lastName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-gray-900 hover:underline">
                      {name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {meta.length > 0 ? meta.join(" · ") : user.role}
                    </div>
                  </div>
                </Link>

                {isSelf ? (
                  <span className="text-xs text-gray-500">You</span>
                ) : state === "accepted" ? (
                  <span className="text-xs text-gray-500">Connected</span>
                ) : state === "pending-sent" ? (
                  <span className="text-xs text-gray-500">Pending</span>
                ) : state === "pending-received" ? (
                  <Button size="sm" variant="outline" render={<Link href={networkHref} />}>
                    Respond in My Network
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => void handleConnect(user.id)}
                  >
                    {isPending ? "Sending..." : "Connect"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {!isLoading && hasNextPage ? (
          <Button
            type="button"
            variant="outline"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
