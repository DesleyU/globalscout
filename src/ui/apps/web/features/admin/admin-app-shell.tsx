import type { AuthUserDto } from "@globalscout/shared";
import { AppShellLayout } from "@/components/layout/app-shell-layout";

export function AdminAppShell({
  user,
  children,
}: {
  user: AuthUserDto;
  children: React.ReactNode;
}) {
  return (
    <AppShellLayout user={user} variant="admin">
      {children}
    </AppShellLayout>
  );
}
