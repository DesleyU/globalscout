"use client";

import { useState } from "react";
import { MailWarning } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function VerifyEmailBanner() {
  const [isResending, setIsResending] = useState(false);

  async function handleResend() {
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        toast.error(data.error ?? "Could not resend verification email");
        return;
      }

      toast.success(data.message ?? "Verification email sent");
    } catch {
      toast.error("Could not resend verification email");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <Alert className="rounded-none border-x-0 border-t-0 border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
      <MailWarning className="size-4 text-amber-600" />
      <AlertTitle>Verify your email address</AlertTitle>
      <AlertDescription className="text-amber-800">
        Messaging and connections are unavailable until you confirm your email.
      </AlertDescription>
      <AlertAction className="static mt-1 flex justify-end sm:absolute sm:mt-0">
        <Button
          size="sm"
          variant="outline"
          className="border-amber-300 bg-white hover:bg-amber-100"
          onClick={() => void handleResend()}
          disabled={isResending}
        >
          {isResending ? "Sending..." : "Resend email"}
        </Button>
      </AlertAction>
    </Alert>
  );
}
