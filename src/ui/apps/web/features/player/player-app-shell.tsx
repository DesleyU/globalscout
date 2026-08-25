import type { AuthUserDto } from "@globalscout/shared";
import { AppShellLayout } from "@/components/layout/app-shell-layout";

export function PlayerAppShell({
  user,
  avatarUrl,
  children,
}: {
  user: AuthUserDto;
  avatarUrl?: string | null;
  children: React.ReactNode;
}) {
  return (
    <AppShellLayout user={user} variant="player" avatarUrl={avatarUrl}>
      {children}
    </AppShellLayout>
  );
}
