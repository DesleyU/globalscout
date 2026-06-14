import { evidenceTypes } from "@globalscout/shared";
import { z } from "zod";

const optionalText = z.string().trim().optional().nullable();

const teamSelectionFields = {
  currentCountry: z.string().trim().min(1, "Current country is required").max(80),
  currentTeamId: z.number().int().positive("Current team is required"),
  currentTeamName: z.string().trim().min(1, "Current team is required").max(120),
};

export const playerIdentitySearchSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(2, "Last name is required").max(80),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  nationality: z.string().trim().min(2, "Nationality is required"),
  ...teamSelectionFields,
  position: z.string().trim().min(1, "Position is required"),
  league: optionalText,
});

export const createPlayerIdentityClaimSchema = playerIdentitySearchSchema
  .omit({ currentTeamName: true })
  .extend({
    externalPlayerId: z.number().int().positive(),
    provider: optionalText,
    currentClub: z.string().trim().min(1, "Current club is required").max(120),
  });

export const addLinkEvidenceSchema = z.object({
  type: z.enum(evidenceTypes),
  url: z.string().trim().url("Enter a valid URL"),
  note: optionalText,
});

export type PlayerIdentitySearchFormValues = z.infer<
  typeof playerIdentitySearchSchema
>;

export type CreatePlayerIdentityClaimFormValues = z.infer<
  typeof createPlayerIdentityClaimSchema
>;

export type AddLinkEvidenceFormValues = z.infer<typeof addLinkEvidenceSchema>;

export function formatPlayerIdentityDisplayName(
  criteria: Pick<PlayerIdentitySearchFormValues, "firstName" | "lastName">,
): string {
  return [criteria.firstName, criteria.lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}
