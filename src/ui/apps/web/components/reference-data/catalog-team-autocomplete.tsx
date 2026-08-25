"use client";

import { Loader2, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FootballTeamDto } from "@/lib/api/reference-data-types";
import { createBrowserReferenceDataApi } from "@/lib/api/reference-data-browser";
import { UnverifiedBadge } from "@/components/reference-data/unverified-badge";
import { SubmitEntryDialog } from "@/components/reference-data/submit-entry-dialog";

const DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

type CatalogTeamAutocompleteProps = {
  country: string;
  catalogId: string;
  teamName: string;
  onTeamChange: (team: { catalogId: string; teamName: string }) => void;
  disabled?: boolean;
  invalid?: boolean;
  inputId?: string;
};

export function CatalogTeamAutocomplete({
  country,
  catalogId,
  teamName,
  onTeamChange,
  disabled = false,
  invalid = false,
  inputId,
}: CatalogTeamAutocompleteProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState(catalogId ? teamName : "");
  const [results, setResults] = useState<FootballTeamDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const countrySelected = country.trim().length > 0;
  const inputDisabled = disabled || !countrySelected;

  useEffect(() => {
    setSearchTerm("");
    setResults([]);
    setIsOpen(false);
    setHasSearched(false);
    setSearchError(null);
  }, [country]);

  useEffect(() => {
    if (catalogId) {
      setSearchTerm(teamName);
    }
  }, [catalogId, teamName]);

  useEffect(() => {
    if (!countrySelected) {
      return;
    }

    const trimmed = searchTerm.trim();
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      setIsSearching(false);
      setHasSearched(false);
      setSearchError(null);
      return;
    }

    if (catalogId && trimmed === teamName) {
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const timeoutId = window.setTimeout(() => {
      const api = createBrowserReferenceDataApi();
      void api
        .searchTeams({ country, searchTerm: trimmed })
        .then((result) => {
          setResults(result.teams);
          setHasSearched(true);
          setIsOpen(true);
        })
        .catch((error: unknown) => {
          setResults([]);
          setHasSearched(true);
          setSearchError(
            error instanceof Error ? error.message : "Team search failed",
          );
          setIsOpen(true);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [country, countrySelected, catalogId, searchTerm, teamName]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  function handleInputChange(value: string) {
    setSearchTerm(value);
    if (catalogId) {
      onTeamChange({ catalogId: "", teamName: "" });
    }
    setIsOpen(true);
  }

  function handleSelectTeam(team: FootballTeamDto) {
    onTeamChange({ catalogId: team.id, teamName: team.name });
    setSearchTerm(team.name);
    setResults([]);
    setIsOpen(false);
    setHasSearched(false);
  }

  const showHint =
    countrySelected &&
    searchTerm.trim().length > 0 &&
    searchTerm.trim().length < MIN_SEARCH_LENGTH;
  const showEmptyState =
    isOpen &&
    hasSearched &&
    !isSearching &&
    !searchError &&
    results.length === 0 &&
    searchTerm.trim().length >= MIN_SEARCH_LENGTH;

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={inputId}
          value={searchTerm}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => {
            if (results.length > 0 || hasSearched) {
              setIsOpen(true);
            }
          }}
          placeholder={
            countrySelected ? "Search for a club" : "Select a country first"
          }
          disabled={inputDisabled}
          aria-invalid={invalid}
          aria-autocomplete="list"
          aria-controls={isOpen ? listboxId : undefined}
          aria-expanded={isOpen}
          autoComplete="off"
          className="pl-10"
        />
        {isSearching ? (
          <Loader2
            className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        ) : null}
      </div>

      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto p-0 text-xs text-muted-foreground"
        onClick={() => setSubmitOpen(true)}
        disabled={!countrySelected || disabled}
      >
        My club isn&apos;t listed
      </Button>

      {showHint ? (
        <p className="text-xs text-muted-foreground">
          Type at least {MIN_SEARCH_LENGTH} characters to search clubs.
        </p>
      ) : null}

      {searchError ? (
        <p className="text-xs text-destructive">{searchError}</p>
      ) : null}

      {isOpen &&
      countrySelected &&
      searchTerm.trim().length >= MIN_SEARCH_LENGTH &&
      (results.length > 0 || showEmptyState) ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {results.map((team) => (
            <li key={team.id} role="none">
              <button
                type="button"
                role="option"
                aria-selected={team.id === catalogId}
                className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelectTeam(team)}
              >
                <Avatar size="sm">
                  {team.logoUrl ? (
                    <AvatarImage src={team.logoUrl} alt="" />
                  ) : null}
                  <AvatarFallback>
                    {team.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {team.name}
                </span>
                {!team.isVerified ? <UnverifiedBadge /> : null}
              </button>
            </li>
          ))}
          {showEmptyState ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              No clubs found. Submit yours if it&apos;s missing.
            </li>
          ) : null}
        </ul>
      ) : null}

      <SubmitEntryDialog
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        country={country}
        kind="team"
        onSubmitted={(entry) => {
          onTeamChange({ catalogId: entry.id, teamName: entry.name });
          setSearchTerm(entry.name);
        }}
      />
    </div>
  );
}
