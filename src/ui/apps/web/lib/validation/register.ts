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
    firstName: z
      .string()
      .trim()
      .min(2, "First name is required")
      .max(50, "First name must be at most 50 characters"),
    lastName: z
      .string()
      .trim()
      .min(2, "Last name is required")
      .max(50, "Last name must be at most 50 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export function toRegisterRequest(values: RegisterFormValues) {
  return {
    email: values.email,
    password: values.password,
    firstName: values.firstName,
    lastName: values.lastName,
  };
}
