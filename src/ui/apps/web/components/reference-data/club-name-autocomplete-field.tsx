"use client";

import { Loader2, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import type { FootballTeamDto } from "@/lib/api/reference-data-types";
import { createBrowserReferenceDataApi } from "@/lib/api/reference-data-browser";

const DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

type ClubNameAutocompleteFieldProps = {
  country: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  inputId?: string;
};

/**
 * Free-text club input with suggestions from the reference-data team catalog, scoped by country.
 * Values still save as a plain string (Profile.ClubName isn't catalog-backed) - unlike
 * CatalogTeamAutocomplete, there is no catalogId to track and no "submit a new team" flow.
 */
export function ClubNameAutocompleteField({
  country,
  value,
  onChange,
  disabled = false,
  invalid = false,
  inputId,
}: ClubNameAutocompleteFieldProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [results, setResults] = useState<FootballTeamDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const countrySelected = country.trim().length > 0;

  useEffect(() => {
    setResults([]);
    setIsOpen(false);
  }, [country]);

  useEffect(() => {
    if (!countrySelected) {
      return;
    }

    const trimmed = value.trim();
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timeoutId = window.setTimeout(() => {
      void createBrowserReferenceDataApi()
        .searchTeams({ country, searchTerm: trimmed })
        .then((result) => {
          setResults(result.teams);
          setIsOpen(true);
        })
        .catch(() => {
          setResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [country, countrySelected, value]);

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

  function handleSelect(team: FootballTeamDto) {
    onChange(team.name);
    setResults([]);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={inputId}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={countrySelected ? "Club" : "Club (add a country for suggestions)"}
          disabled={disabled}
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

      {isOpen && results.length > 0 ? (
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
                aria-selected={team.name === value}
                className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(team)}
              >
                <Avatar size="sm">
                  {team.logoUrl ? <AvatarImage src={team.logoUrl} alt="" /> : null}
                  <AvatarFallback>{team.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate">{team.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
