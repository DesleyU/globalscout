import type { Metadata } from "next";
import { Suspense } from "react";
import { AlreadySignedInPanel } from "@/features/auth/already-signed-in-panel";
import { SignInForm } from "@/features/auth/sign-in-form";
import { getPostAuthRedirect, getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage() {
  const session = await getSession();

  if (session) {
    const continueHref = await getPostAuthRedirect(session.user.role);

    return <AlreadySignedInPanel user={session.user} continueHref={continueHref} />;
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto h-96 w-full max-w-md animate-pulse rounded-xl bg-white/10" />
      }
    >
      <SignInForm />
    </Suspense>
  );
}
