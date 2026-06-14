"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { AuthFieldLabel } from "@/components/auth/auth-form-primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validation/forgot-password";

export function ForgotPasswordForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    setSubmittedEmail(values.email);
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.handleSubmit(onSubmit)(event);
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md border-0 bg-white shadow-2xl">
        <CardContent className="p-8">
          {!submittedEmail ? (
            <>
              <Link
                href="/sign-in"
                className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>

              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Reset password
              </h2>
              <p className="mb-7 text-sm text-gray-500">
                Enter your email and we&apos;ll send you a link to reset your
                password.
              </p>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div>
                      <AuthFieldLabel htmlFor="forgot-password-email">
                        Email address
                      </AuthFieldLabel>
                      <div className="relative">
                        <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          {...field}
                          id="forgot-password-email"
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

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <div className="py-4 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-gray-900">
                Check your inbox
              </h2>
              <p className="mb-8 text-sm text-gray-500">
                We&apos;ve sent a password reset link to{" "}
                <span className="font-medium text-gray-900">{submittedEmail}</span>
                .
              </p>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                render={<Link href="/sign-in" />}
              >
                Back to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
