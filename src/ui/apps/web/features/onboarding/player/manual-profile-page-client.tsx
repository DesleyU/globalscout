"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
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
import { loadSearchCriteria, saveManualCountry } from "@/features/onboarding/player/storage";
import type { FootballCountryDto } from "@/lib/api/reference-data-types";
import { createBrowserReferenceDataApi } from "@/lib/api/reference-data-browser";
import { createBrowserPlayerIdentityApi } from "@/lib/api/player-identity-browser";
import {
  selfReportedClaimSchema,
  type SelfReportedClaimFormValues,
} from "@/lib/validation/player-identity";
import { toast } from "sonner";

export function ManualProfilePageClient() {
  const router = useRouter();
  const savedCriteria = loadSearchCriteria();

  const form = useForm<SelfReportedClaimFormValues>({
    resolver: zodResolver(selfReportedClaimSchema),
    defaultValues: {
      firstName: savedCriteria?.firstName ?? "",
      lastName: savedCriteria?.lastName ?? "",
      dateOfBirth: savedCriteria?.dateOfBirth ?? "",
      nationality: savedCriteria?.nationality ?? "",
      currentCountry: savedCriteria?.currentCountry ?? "",
      currentClub: savedCriteria?.currentTeamName ?? "",
      position: savedCriteria?.position ?? "",
      previousClub: "",
      league: savedCriteria?.league ?? "",
    },
  });

  const [countries, setCountries] = useState<FootballCountryDto[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

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

  async function handleSubmit(values: SelfReportedClaimFormValues) {
    try {
      const api = createBrowserPlayerIdentityApi();
      await api.createSelfReportedClaim(values);
      saveManualCountry(values.currentCountry);
      router.push("/onboarding/player/stats");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create profile",
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingHeader
        step={2}
        totalSteps={4}
        backHref="/onboarding/player/connect"
      />

      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            Build your player profile
          </h1>
          <p className="text-gray-500">
            Tell us about yourself. Your profile will be visible to scouts as
            self-reported until verified.
          </p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-8">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void form.handleSubmit(handleSubmit)(event);
              }}
            >
              <FieldGroup className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="firstName"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>First name</FieldLabel>
                        <Input {...field} aria-invalid={fieldState.invalid} />
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
                        <FieldLabel>Last name</FieldLabel>
                        <Input {...field} aria-invalid={fieldState.invalid} />
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
                        <FieldLabel>Date of birth</FieldLabel>
                        <Input
                          {...field}
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
                        <FieldLabel>Nationality</FieldLabel>
                        <Input {...field} aria-invalid={fieldState.invalid} />
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
                      <FieldLabel>Current country</FieldLabel>
                      <Select
                        value={field.value || null}
                        onValueChange={field.onChange}
                        disabled={countriesLoading}
                      >
                        <SelectTrigger className="w-full">
                          {countriesLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
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

                <Controller
                  name="currentClub"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Current club</FieldLabel>
                      <Input
                        {...field}
                        placeholder="e.g. FC Voluntari U19"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid ? (
                        <FieldError errors={[fieldState.error]} />
                      ) : null}
                    </Field>
                  )}
                />

                <Controller
                  name="position"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Position</FieldLabel>
                      <Select
                        value={field.value || null}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
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

                <Controller
                  name="league"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>League (optional)</FieldLabel>
                      <Input {...field} value={field.value ?? ""} />
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
                  disabled={form.formState.isSubmitting || countriesLoading}
                >
                  {form.formState.isSubmitting ? "Saving..." : "Continue"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
