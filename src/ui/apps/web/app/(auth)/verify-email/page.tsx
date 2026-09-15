import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailPanel } from "@/features/auth/verify-email-panel";

export const metadata: Metadata = {
  title: "Verify email",
};

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto h-96 w-full max-w-md animate-pulse rounded-xl bg-white/10" />
      }
    >
      <VerifyEmailPanel />
    </Suspense>
  );
}
