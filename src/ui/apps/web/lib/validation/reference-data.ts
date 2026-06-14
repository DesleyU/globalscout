import { z } from "zod";

export const searchFootballTeamsSchema = z.object({
  country: z.string().trim().min(1, "Country is required").max(80),
  searchTerm: z.string().trim().min(1, "Search term is required").max(120),
});

export type SearchFootballTeamsFormValues = z.infer<
  typeof searchFootballTeamsSchema
>;
