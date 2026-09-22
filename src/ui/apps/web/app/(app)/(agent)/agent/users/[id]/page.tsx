import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserProfileViewClient } from "@/features/profile/user-profile-view-client";
import { fetchPublicUserProfile } from "@/features/profile/load-user-profile";
import { requireAgent } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Player Profile",
};

type UserProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function AgentUserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params;
  const session = await requireAgent();

  const user = await fetchPublicUserProfile(id);
  if (!user) {
    notFound();
  }

  return <UserProfileViewClient currentUserId={session.user.id} user={user} variant="agent" />;
}
