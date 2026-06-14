"use client";

import type { AuthUserDto } from "@globalscout/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { AuthBrandingPanel } from "@/components/auth/auth-branding-panel";
import {
  AuthFieldLabel,
  AuthFormError,
} from "@/components/auth/auth-form-primitives";
import { PasswordStrengthBar } from "@/components/auth/password-strength-bar";
import {
  AuthLegalFooter,
  SocialAuthButtons,
} from "@/components/auth/social-auth-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSession } from "@/features/auth/session-provider";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validation/register";

export function CreateAccountForm() {
  const router = useRouter();
  const { setUser } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    },
  });

  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as {
        user?: AuthUserDto;
        redirectTo?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Registration failed");
      }

      if (data.user) {
        setUser(data.user);
      }

      toast.success("Account created successfully");
      router.push(data.redirectTo ?? "/onboarding/account-type");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      setFormError(message);
      toast.error(message);
    }
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.handleSubmit(onSubmit)(event);
  }

  return (
    <div className="grid items-center gap-12 md:grid-cols-2">
      <AuthBrandingPanel variant="create-account" />

      <Card className="border-0 bg-white shadow-2xl">
        <CardContent className="p-8">
          <div className="mb-8">
            <h2 className="mb-1 text-2xl font-bold text-gray-900">
              Create Account
            </h2>
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-blue-600 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          {formError ? <AuthFormError message={formError} /> : null}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <Controller
              name="fullName"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <AuthFieldLabel htmlFor="register-full-name">
                    Full name
                  </AuthFieldLabel>
                  <div className="relative">
                    <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      {...field}
                      id="register-full-name"
                      placeholder="John Smith"
                      autoComplete="name"
                      className="pl-10"
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  {fieldState.invalid ? (
                    <p className="mt-1 text-sm text-destructive">
                      {fieldState.error?.message}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <AuthFieldLabel htmlFor="register-email">
                    Email address
                  </AuthFieldLabel>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      {...field}
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="pl-10"
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  {fieldState.invalid ? (
                    <p className="mt-1 text-sm text-destructive">
                      {fieldState.error?.message}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <AuthFieldLabel htmlFor="register-password">
                    Password
                  </AuthFieldLabel>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      {...field}
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                      className="pr-10 pl-10"
                      aria-invalid={fieldState.invalid}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <PasswordStrengthBar password={password} />
                  {fieldState.invalid ? (
                    <p className="mt-1 text-sm text-destructive">
                      {fieldState.error?.message}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <AuthFieldLabel htmlFor="register-confirm-password">
                    Confirm password
                  </AuthFieldLabel>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      {...field}
                      id="register-confirm-password"
                      type="password"
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      className="pl-10"
                      aria-invalid={fieldState.invalid}
                    />
                    {confirmPassword && confirmPassword === password ? (
                      <CheckCircle2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-green-500" />
                    ) : null}
                  </div>
                  {fieldState.invalid ? (
                    <p className="mt-1 text-sm text-destructive">
                      {fieldState.error?.message}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <SocialAuthButtons />
          <AuthLegalFooter />
        </CardContent>
      </Card>
    </div>
  );
}
