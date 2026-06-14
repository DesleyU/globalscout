"use client";

import type { AuthUserDto } from "@globalscout/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { AuthBrandingPanel } from "@/components/auth/auth-branding-panel";
import {
  AuthFieldLabel,
  AuthFormError,
} from "@/components/auth/auth-form-primitives";
import {
  AuthLegalFooter,
  SocialAuthButtons,
} from "@/components/auth/social-auth-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSession } from "@/features/auth/session-provider";
import { DEFAULT_AUTHENTICATED_REDIRECT } from "@/lib/auth/constants";
import {
  signInSchema,
  type SignInFormValues,
} from "@/lib/validation/sign-in";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: SignInFormValues) {
    setFormError(null);

    try {
      const response = await fetch("/api/auth/sign-in", {
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
        throw new Error(data.error ?? "Sign in failed");
      }

      if (data.user) {
        setUser(data.user);
      }

      toast.success("Signed in successfully");

      const destination =
        data.redirectTo ??
        searchParams.get("returnTo") ??
        DEFAULT_AUTHENTICATED_REDIRECT;
      router.push(destination);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign in failed";
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
      <AuthBrandingPanel variant="sign-in" />

      <Card className="border-0 bg-white shadow-2xl">
        <CardContent className="p-8">
          <div className="mb-8">
            <h2 className="mb-1 text-2xl font-bold text-gray-900">Sign In</h2>
            <p className="text-sm text-gray-500">
              New to GlobalScout?{" "}
              <Link
                href="/create-account"
                className="font-medium text-blue-600 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>

          {formError ? <AuthFormError message={formError} /> : null}

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <div>
                  <AuthFieldLabel htmlFor="sign-in-email">
                    Email address
                  </AuthFieldLabel>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      {...field}
                      id="sign-in-email"
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
                  <div className="mb-1.5 flex items-center justify-between">
                    <AuthFieldLabel htmlFor="sign-in-password" className="mb-0">
                      Password
                    </AuthFieldLabel>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      {...field}
                      id="sign-in-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="current-password"
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
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
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
