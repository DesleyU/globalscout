"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { CatalogTeamAutocomplete } from "@/components/reference-data/catalog-team-autocomplete";
import { CompetitionAutocompleteField } from "@/components/reference-data/competition-autocomplete-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FootballCountryDto } from "@/lib/api/reference-data-types";
import { createBrowserReferenceDataApi } from "@/lib/api/reference-data-browser";
import { createBrowserStatsApi } from "@/lib/api/stats-browser";
import {
  manualSeasonSchema,
  type ManualSeasonFormValues,
} from "@/lib/validation/stats";

function formatSeasonLabel(year: string): string {
  const start = Number.parseInt(year, 10);
  if (!Number.isFinite(start)) {
    return year;
  }
  const end = String(start + 1).slice(-2);
  return `${start}/${end}`;
}

function buildSeasonOptions(
  lockedSeasons: string[],
  currentYear: number,
): string[] {
  const locked = new Set(lockedSeasons);
  const options: string[] = [];

  for (let year = currentYear; year >= currentYear - 15; year -= 1) {
    const value = String(year);
    if (!locked.has(value)) {
      options.push(value);
    }
  }

  return options;
}

const emptyCompetition = {
  teamCatalogId: "",
  teamName: "",
  competitionCatalogId: "",
  competitionName: "",
  appearances: 0,
  minutes: 0,
  goals: 0,
  assists: 0,
  yellowCards: 0,
  redCards: 0,
  rating: null as number | null,
};

type ManualSeasonFormProps = {
  lockedSeasons: string[];
  initialSeason?: string;
  initialCountry?: string;
  initialValues?: Partial<ManualSeasonFormValues>;
  isPremium?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function ManualSeasonForm({
  lockedSeasons,
  initialSeason,
  initialCountry = "",
  initialValues,
  isPremium = false,
  onSuccess,
  onCancel,
  submitLabel = "Save season",
}: ManualSeasonFormProps) {
  const currentYear = new Date().getFullYear();
  const seasonOptions = useMemo(
    () => buildSeasonOptions(lockedSeasons, currentYear),
    [lockedSeasons, currentYear],
  );

  const form = useForm<ManualSeasonFormValues>({
    resolver: zodResolver(manualSeasonSchema),
    defaultValues: {
      season:
        initialValues?.season ??
        initialSeason ??
        seasonOptions[0] ??
        String(currentYear),
      country: initialValues?.country ?? initialCountry,
      competitions: initialValues?.competitions ?? [{ ...emptyCompetition }],
      shotsTotal: initialValues?.shotsTotal ?? null,
      shotsOnTarget: initialValues?.shotsOnTarget ?? null,
      passesTotal: initialValues?.passesTotal ?? null,
      passesAccuracy: initialValues?.passesAccuracy ?? null,
      tacklesTotal: initialValues?.tacklesTotal ?? null,
      tacklesInterceptions: initialValues?.tacklesInterceptions ?? null,
      duelsWon: initialValues?.duelsWon ?? null,
      foulsCommitted: initialValues?.foulsCommitted ?? null,
      foulsDrawn: initialValues?.foulsDrawn ?? null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "competitions",
  });

  const [countries, setCountries] = useState<FootballCountryDto[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedCountry = form.watch("country");
  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    const api = createBrowserReferenceDataApi();
    void api
      .getCountries()
      .then((result) => {
        setCountries(
          [...result.countries].sort((left, right) =>
            left.name.localeCompare(right.name),
          ),
        );
      })
      .finally(() => {
        setCountriesLoading(false);
      });
  }, []);

  async function handleSubmit(values: ManualSeasonFormValues) {
    setSubmitError(null);

    try {
      const api = createBrowserStatsApi();
      await api.updateMyStats(values);
      onSuccess?.();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not save statistics",
      );
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit(handleSubmit)(event);
      }}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="season"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="manual-season-year">Season</FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={Boolean(initialSeason) || seasonOptions.length === 0}
              >
                <SelectTrigger id="manual-season-year" className="w-full">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {seasonOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {formatSeasonLabel(year)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lockedSeasons.length > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Seasons already covered by API-Football cannot be entered
                  manually.
                </p>
              ) : null}
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          name="country"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="manual-season-country">Country</FieldLabel>
              <Select
                value={field.value || null}
                onValueChange={field.onChange}
                disabled={countriesLoading || Boolean(initialCountry)}
              >
                <SelectTrigger id="manual-season-country" className="w-full">
                  {countriesLoading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    <SelectValue placeholder="Select country" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.name} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Competitions
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ...emptyCompetition })}
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add competition
          </Button>
        </div>

        {fields.map((field, index) => (
          <Card key={field.id} className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">
                Competition {index + 1}
              </CardTitle>
              {fields.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Remove
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name={`competitions.${index}.teamCatalogId`}
                control={form.control}
                render={({ field: idField, fieldState }) => (
                  <Controller
                    name={`competitions.${index}.teamName`}
                    control={form.control}
                    render={({ field: nameField }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Club</FieldLabel>
                        <CatalogTeamAutocomplete
                          country={selectedCountry}
                          catalogId={idField.value}
                          teamName={nameField.value}
                          onTeamChange={({ catalogId, teamName }) => {
                            idField.onChange(catalogId);
                            nameField.onChange(teamName);
                          }}
                          disabled={isSubmitting}
                          invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : null}
                      </Field>
                    )}
                  />
                )}
              />

              <Controller
                name={`competitions.${index}.competitionCatalogId`}
                control={form.control}
                render={({ field: idField, fieldState }) => (
                  <Controller
                    name={`competitions.${index}.competitionName`}
                    control={form.control}
                    render={({ field: nameField }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Competition</FieldLabel>
                        <CompetitionAutocompleteField
                          country={selectedCountry}
                          catalogId={idField.value}
                          competitionName={nameField.value}
                          onCompetitionChange={({ catalogId, competitionName }) => {
                            idField.onChange(catalogId);
                            nameField.onChange(competitionName);
                          }}
                          disabled={isSubmitting}
                          invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : null}
                      </Field>
                    )}
                  />
                )}
              />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ["appearances", "Apps"],
                    ["minutes", "Minutes"],
                    ["goals", "Goals"],
                    ["assists", "Assists"],
                    ["yellowCards", "YC"],
                    ["redCards", "RC"],
                    ["rating", "Rating"],
                  ] as const
                ).map(([key, label]) => (
                  <Controller
                    key={key}
                    name={`competitions.${index}.${key}`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{label}</FieldLabel>
                        <Input
                          {...field}
                          type="number"
                          min={0}
                          step={key === "rating" ? "0.1" : "1"}
                          value={field.value ?? ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            field.onChange(
                              value === ""
                                ? key === "rating"
                                  ? null
                                  : 0
                                : Number(value),
                            );
                          }}
                          disabled={isSubmitting}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : null}
                      </Field>
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isPremium ? (
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Premium season metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ["shotsTotal", "Shots total"],
                  ["shotsOnTarget", "Shots on target"],
                  ["passesTotal", "Passes total"],
                  ["passesAccuracy", "Pass accuracy %"],
                  ["tacklesTotal", "Tackles"],
                  ["tacklesInterceptions", "Interceptions"],
                  ["duelsWon", "Duels won"],
                  ["foulsCommitted", "Fouls committed"],
                  ["foulsDrawn", "Fouls drawn"],
                ] as const
              ).map(([key, label]) => (
                <Controller
                  key={key}
                  name={key}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>{label}</FieldLabel>
                      <Input
                        {...field}
                        type="number"
                        min={0}
                        value={field.value ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          field.onChange(value === "" ? null : Number(value));
                        }}
                        disabled={isSubmitting}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />
              ))}
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      {submitError ? (
        <p className="text-sm text-destructive">{submitError}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting || seasonOptions.length === 0}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
