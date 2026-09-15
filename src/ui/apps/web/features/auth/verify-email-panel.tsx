"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type VerifyStatus = "verifying" | "verified" | "already-verified" | "invalid" | "missing-token";

export function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerifyStatus>(token ? "verifying" : "missing-token");
  const [isResending, setIsResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = (await response.json()) as {
          alreadyVerified?: boolean;
          error?: string;
        };

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setStatus("invalid");
          return;
        }

        setStatus(data.alreadyVerified ? "already-verified" : "verified");
      } catch {
        if (!cancelled) {
          setStatus("invalid");
        }
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend() {
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Sign in to request a new verification link");
        } else {
          toast.error(data.error ?? "Could not resend verification email");
        }
        return;
      }

      setResendSent(true);
      toast.success(data.message ?? "Verification email sent");
    } catch {
      toast.error("Could not resend verification email");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md border-0 bg-white shadow-2xl">
        <CardContent className="p-8 text-center">
          {status === "verifying" ? (
            <>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-gray-900">
                Verifying your email
              </h2>
              <p className="text-sm text-gray-500">
                Hang on a moment while we confirm your link.
              </p>
            </>
          ) : null}

          {status === "verified" || status === "already-verified" ? (
            <>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-gray-900">
                {status === "already-verified"
                  ? "Your email is already verified"
                  : "Email verified"}
              </h2>
              <p className="mb-8 text-sm text-gray-500">
                You&apos;re all set. You can continue using GlobalScout.
              </p>
              <Button size="lg" className="w-full" render={<Link href="/sign-in" />}>
                Continue to sign in
              </Button>
            </>
          ) : null}

          {status === "invalid" || status === "missing-token" ? (
            <>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <MailWarning className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="mb-3 text-2xl font-bold text-gray-900">
                This link is invalid or has expired
              </h2>
              <p className="mb-8 text-sm text-gray-500">
                {resendSent
                  ? "We've sent you a new verification link. Check your inbox."
                  : "Sign in and we can send you a new verification link."}
              </p>
              {!resendSent ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => void handleResend()}
                  disabled={isResending}
                >
                  {isResending ? "Sending..." : "Resend verification email"}
                </Button>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
