import { z } from "zod";

const competitionEntrySchema = z.object({
  teamCatalogId: z.string().uuid("Select a team"),
  teamName: z.string().trim().min(1),
  competitionCatalogId: z.string().uuid("Select a competition"),
  competitionName: z.string().trim().min(1),
  appearances: z.number().int().min(0),
  minutes: z.number().int().min(0),
  goals: z.number().int().min(0),
  assists: z.number().int().min(0),
  yellowCards: z.number().int().min(0),
  redCards: z.number().int().min(0),
  rating: z.number().min(0).max(10).nullable().optional(),
});

export const manualSeasonSchema = z.object({
  season: z
    .string()
    .regex(/^\d{4}$/, "Season must be a four-digit year")
    .refine(
      (value) => {
        const year = Number.parseInt(value, 10);
        return year >= 1950 && year <= 2100;
      },
      { message: "Season must be between 1950 and 2100" },
    ),
  country: z.string().trim().min(1, "Country is required").max(80),
  competitions: z
    .array(competitionEntrySchema)
    .min(1, "Add at least one competition"),
  shotsTotal: z.number().int().min(0).nullable().optional(),
  shotsOnTarget: z.number().int().min(0).nullable().optional(),
  passesTotal: z.number().int().min(0).nullable().optional(),
  passesAccuracy: z.number().min(0).max(100).nullable().optional(),
  tacklesTotal: z.number().int().min(0).nullable().optional(),
  tacklesInterceptions: z.number().int().min(0).nullable().optional(),
  duelsWon: z.number().int().min(0).nullable().optional(),
  foulsCommitted: z.number().int().min(0).nullable().optional(),
  foulsDrawn: z.number().int().min(0).nullable().optional(),
});

export type ManualSeasonFormValues = z.infer<typeof manualSeasonSchema>;

export type ManualCompetitionFormValues = z.infer<
  typeof competitionEntrySchema
>;
