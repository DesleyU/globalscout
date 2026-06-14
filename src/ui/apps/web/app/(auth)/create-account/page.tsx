import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateAccountForm } from "@/features/auth/create-account-form";
import { getPostAuthRedirect, getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function CreateAccountPage() {
  const session = await getSession();

  if (session) {
    redirect(await getPostAuthRedirect(session.user.role));
  }

  return <CreateAccountForm />;
}
