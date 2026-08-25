"use client";

import type { AuthUserDto } from "@globalscout/shared";
import type { UserProfileDto } from "@globalscout/shared";
import { useRouter } from "next/navigation";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { SignOutButton } from "@/features/auth/sign-out-button";
import { ProfileEditForm } from "@/features/profile/profile-edit-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatUserDisplayName } from "@/lib/auth/format-user-display";

type ProfilePageClientProps = {
  user: AuthUserDto;
  profile: UserProfileDto;
};

export function ProfilePageClient({ user, profile }: ProfilePageClientProps) {
  const router = useRouter();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile photo, bio, and account details.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,28rem)_1fr]">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Profile photo</CardTitle>
            <CardDescription>
              This photo appears on your profile and in the app header.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUpload user={user} avatarUrl={profile.avatar} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>
              Information scouts see on your public profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileEditForm
              profile={profile}
              onSaved={() => router.refresh()}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            {formatUserDisplayName(user)} · {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  );
}
