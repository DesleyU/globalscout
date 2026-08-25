import type { AuthUserDto } from "@globalscout/shared";
import { AppSidebar, type SidebarVariant } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

type AppShellLayoutProps = {
  user: AuthUserDto;
  variant: SidebarVariant;
  avatarUrl?: string | null;
  children: React.ReactNode;
};

export function AppShellLayout({
  user,
  variant,
  avatarUrl,
  children,
}: AppShellLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar variant={variant} />
      <div className="ml-48 flex min-h-screen flex-col">
        <DashboardHeader user={user} variant={variant} avatarUrl={avatarUrl} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
