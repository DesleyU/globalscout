import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfilePageClient } from "@/features/profile/profile-page-client";
import { fetchMyFullProfile } from "@/features/profile/load-profile-data";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const profileResult = await fetchMyFullProfile();
  if (!profileResult?.profile) {
    redirect("/dashboard");
  }

  return (
    <ProfilePageClient
      user={session.user}
      profile={profileResult.profile}
    />
  );
}
