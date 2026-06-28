import { PlayerAppShell } from "@/features/player/player-app-shell";
import { requirePlayer } from "@/lib/auth";

export default async function PlayerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requirePlayer();

  return <PlayerAppShell user={session.user}>{children}</PlayerAppShell>;
}
