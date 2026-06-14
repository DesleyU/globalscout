import { z } from "zod";

export const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    fullName: z
      .string()
      .trim()
      .min(2, "Full name is required")
      .refine((value) => {
        const parts = value.trim().split(/\s+/);
        return parts.length >= 2 && parts[1]!.length >= 2;
      }, "Enter your first and last name"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

export function toRegisterRequest(values: RegisterFormValues) {
  const { firstName, lastName } = splitFullName(values.fullName);
  return {
    email: values.email,
    password: values.password,
    firstName,
    lastName,
  };
}
