import { competitionLevels, competitionTypes } from "@/lib/api/reference-data-types";
import { z } from "zod";

export const searchFootballTeamsSchema = z.object({
  country: z.string().trim().min(1, "Country is required").max(80),
  searchTerm: z.string().trim().min(1, "Search term is required").max(120),
  requiresExternalId: z.boolean().default(false),
});

export const searchFootballCompetitionsSchema = z.object({
  country: z.string().trim().min(1, "Country is required").max(80),
  searchTerm: z.string().trim().min(1, "Search term is required").max(120),
  level: z.enum(competitionLevels).optional().nullable(),
});

export const listFootballCompetitionsSchema = z.object({
  country: z.string().trim().min(1, "Country is required").max(80),
  level: z.enum(competitionLevels).optional().nullable(),
});

export const submitFootballTeamSchema = z.object({
  country: z.string().trim().min(1, "Country is required").max(80),
  name: z.string().trim().min(2, "Name is required").max(120),
});

export const submitFootballCompetitionSchema = z.object({
  country: z.string().trim().min(1, "Country is required").max(80),
  name: z.string().trim().min(2, "Name is required").max(120),
  levelHint: z.enum(competitionLevels),
  typeHint: z.enum(competitionTypes),
});

export type SearchFootballTeamsFormValues = z.infer<
  typeof searchFootballTeamsSchema
>;

export type SearchFootballCompetitionsFormValues = z.infer<
  typeof searchFootballCompetitionsSchema
>;
