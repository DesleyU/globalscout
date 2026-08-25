import { z } from "zod";

const optionalText = z.string().trim().max(500).optional().nullable();
const optionalShortText = z.string().trim().max(120).optional().nullable();

export const profileEditSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  bio: optionalText,
  position: optionalShortText,
  age: z.number().int().min(14).max(60).nullable().optional(),
  height: z.number().int().min(100).max(250).nullable().optional(),
  weight: z.number().int().min(40).max(200).nullable().optional(),
  nationality: optionalShortText,
  clubName: optionalShortText,
  phone: optionalShortText,
  website: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (value) => !value || /^https?:\/\/.+/i.test(value),
      "Enter a valid URL",
    ),
  instagram: optionalShortText,
  twitter: optionalShortText,
  linkedin: optionalShortText,
  country: optionalShortText,
  city: optionalShortText,
});

export type ProfileEditFormValues = z.infer<typeof profileEditSchema>;
