"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ONBOARDING_POSITIONS } from "@/features/onboarding/player/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserProfileDto } from "@globalscout/shared";
import {
  profileEditSchema,
  type ProfileEditFormValues,
} from "@/lib/validation/profile";
import { toast } from "sonner";

type ProfileEditFormProps = {
  profile: UserProfileDto;
  onSaved?: () => void;
};

async function updateProfile(body: ProfileEditFormValues) {
  const response = await fetch("/api/users/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Could not update profile");
  }
}

export function ProfileEditForm({ profile, onSaved }: ProfileEditFormProps) {
  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio ?? "",
      position: profile.position ?? "",
      age: profile.age ?? null,
      height: profile.height ?? null,
      weight: profile.weight ?? null,
      nationality: profile.nationality ?? "",
      clubName: profile.clubName ?? "",
      phone: profile.phone ?? "",
      website: profile.website ?? "",
      instagram: profile.instagram ?? "",
      twitter: profile.twitter ?? "",
      linkedin: profile.linkedin ?? "",
      country: profile.country ?? "",
      city: profile.city ?? "",
    },
  });

  async function handleSubmit(values: ProfileEditFormValues) {
    try {
      await updateProfile(values);
      toast.success("Profile updated.");
      onSaved?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update profile",
      );
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit(handleSubmit)(event);
      }}
    >
      <FieldGroup className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            name="firstName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>First name</FieldLabel>
                <Input {...field} disabled={isSubmitting} />
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
                <Input {...field} disabled={isSubmitting} />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )}
          />
        </div>

        <Controller
          name="bio"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Bio</FieldLabel>
              <Input {...field} value={field.value ?? ""} disabled={isSubmitting} />
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
                disabled={isSubmitting}
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

        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              ["age", "Age"],
              ["height", "Height (cm)"],
              ["weight", "Weight (kg)"],
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
                    type="number"
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["nationality", "Nationality"],
              ["clubName", "Club"],
              ["country", "Country"],
              ["city", "City"],
              ["phone", "Phone"],
              ["website", "Website"],
              ["instagram", "Instagram"],
              ["twitter", "Twitter"],
              ["linkedin", "LinkedIn"],
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
                    value={field.value ?? ""}
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Saving...
            </>
          ) : (
            "Save profile"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
