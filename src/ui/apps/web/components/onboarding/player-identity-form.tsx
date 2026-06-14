"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { TeamAutocompleteField } from "@/components/onboarding/team-autocomplete-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { ONBOARDING_POSITIONS } from "@/features/onboarding/player/constants";
import type { FootballCountryDto } from "@/lib/api/reference-data-types";
import { createBrowserReferenceDataApi } from "@/lib/api/reference-data-browser";
import {
  playerIdentitySearchSchema,
  type PlayerIdentitySearchFormValues,
} from "@/lib/validation/player-identity";

type PlayerIdentityFormProps = {
  defaultValues?: Partial<PlayerIdentitySearchFormValues>;
  onSubmit: (values: PlayerIdentitySearchFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
};

const emptyDefaults: PlayerIdentitySearchFormValues = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  nationality: "",
  currentCountry: "",
  currentTeamId: 0,
  currentTeamName: "",
  position: "",
  league: "",
};

export function PlayerIdentityForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: PlayerIdentityFormProps) {
  const form = useForm<PlayerIdentitySearchFormValues>({
    resolver: zodResolver(playerIdentitySearchSchema),
    defaultValues: {
      ...emptyDefaults,
      ...defaultValues,
    },
  });

  const [countries, setCountries] = useState<FootballCountryDto[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);

  const selectedCountry = form.watch("currentCountry");

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
      .catch((error: unknown) => {
        setCountriesError(
          error instanceof Error ? error.message : "Could not load countries",
        );
      })
      .finally(() => {
        setCountriesLoading(false);
      });
  }, []);

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.handleSubmit(onSubmit)(event);
  }

  function clearTeamSelection() {
    form.setValue("currentTeamId", 0, { shouldValidate: true });
    form.setValue("currentTeamName", "", { shouldValidate: true });
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-8">
        <form onSubmit={handleFormSubmit}>
          <FieldGroup className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="identity-first-name">
                      First Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="identity-first-name"
                      placeholder="e.g. John"
                      autoComplete="given-name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

              <Controller
                name="lastName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="identity-last-name">
                      Last Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="identity-last-name"
                      placeholder="e.g. Smith"
                      autoComplete="family-name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                name="dateOfBirth"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="identity-dob">Date of Birth</FieldLabel>
                    <Input
                      {...field}
                      id="identity-dob"
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />

              <Controller
                name="nationality"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="identity-nationality">
                      Nationality
                    </FieldLabel>
                    <Input
                      {...field}
                      id="identity-nationality"
                      placeholder="e.g. Netherlands"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="currentCountry"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="identity-current-country">
                    Current Country
                  </FieldLabel>
                  <Select
                    value={field.value || null}
                    onValueChange={(value) => {
                      field.onChange(value);
                      clearTeamSelection();
                    }}
                    disabled={countriesLoading || Boolean(countriesError)}
                  >
                    <SelectTrigger
                      id="identity-current-country"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      {countriesLoading ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading countries...
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
                  {countriesError ? (
                    <p className="mt-1 text-sm text-destructive">{countriesError}</p>
                  ) : null}
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />

            <Controller
              name="currentTeamId"
              control={form.control}
              render={({ field: teamIdField, fieldState }) => (
                <Controller
                  name="currentTeamName"
                  control={form.control}
                  render={({ field: teamNameField }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="identity-current-team">
                        Current Team
                      </FieldLabel>
                      <TeamAutocompleteField
                        country={selectedCountry}
                        teamId={teamIdField.value}
                        teamName={teamNameField.value}
                        onTeamChange={({ teamId, teamName }) => {
                          teamIdField.onChange(teamId);
                          teamNameField.onChange(teamName);
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
              name="position"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="identity-position">Position</FieldLabel>
                  <Select
                    value={field.value || null}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="identity-position"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {ONBOARDING_POSITIONS.map((position) => (
                        <SelectItem key={position.value} value={position.value}>
                          {position.label}
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

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting || countriesLoading}
            >
              {isSubmitting ? "Continuing..." : "Continue"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
