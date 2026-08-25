import { PlayerAppShell } from "@/features/player/player-app-shell";
import { fetchMyFullProfile } from "@/features/profile/load-profile-data";
import { requirePlayer } from "@/lib/auth";

export default async function PlayerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requirePlayer();
  const profileResult = await fetchMyFullProfile();
  const avatarUrl = profileResult?.profile?.avatar ?? null;

  return (
    <PlayerAppShell user={session.user} avatarUrl={avatarUrl}>
      {children}
    </PlayerAppShell>
  );
}
