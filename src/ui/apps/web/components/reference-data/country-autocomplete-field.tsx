"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import type { FootballCountryDto } from "@/lib/api/reference-data-types";
import { createBrowserReferenceDataApi } from "@/lib/api/reference-data-browser";

const MAX_SUGGESTIONS = 8;

type CountryAutocompleteFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  inputId?: string;
  placeholder?: string;
};

/**
 * Free-text country input with suggestions from the static reference-data country list.
 * Values still save as a plain string (Profile.Country/Nationality aren't catalog-backed),
 * but picking from the list keeps new/edited profiles spelled consistently for search matching.
 */
export function CountryAutocompleteField({
  value,
  onChange,
  disabled = false,
  invalid = false,
  inputId,
  placeholder = "Country",
}: CountryAutocompleteFieldProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries] = useState<FootballCountryDto[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void createBrowserReferenceDataApi()
      .getCountries()
      .then((result) => {
        if (!cancelled) {
          setCountries(result.countries);
        }
      })
      .catch(() => {
        // Non-fatal: field still works as plain free text without suggestions.
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const suggestions = useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      return [];
    }
    return countries
      .filter((c) => c.name.toLowerCase().includes(trimmed))
      .slice(0, MAX_SUGGESTIONS);
  }, [countries, value]);

  function handleSelect(country: FootballCountryDto) {
    onChange(country.name);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={inputId}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid}
        aria-autocomplete="list"
        aria-controls={isOpen ? listboxId : undefined}
        aria-expanded={isOpen}
        autoComplete="off"
      />

      {isOpen && suggestions.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {suggestions.map((country) => (
            <li key={country.name} role="none">
              <button
                type="button"
                role="option"
                aria-selected={country.name === value}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(country)}
              >
                {country.flagUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- small flag icon, not worth next/image here
                  <img src={country.flagUrl} alt="" className="h-3 w-4 shrink-0 object-cover" />
                ) : null}
                <span className="truncate">{country.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
