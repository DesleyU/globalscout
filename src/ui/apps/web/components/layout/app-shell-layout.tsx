import type { AuthUserDto } from "@globalscout/shared";
import { AppSidebar, type SidebarVariant } from "@/components/layout/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { VerifyEmailBanner } from "@/components/layout/verify-email-banner";
import { MessagesProvider } from "@/features/messages/messages-provider";

type AppShellLayoutProps = {
  user: AuthUserDto;
  variant: SidebarVariant;
  avatarUrl?: string | null;
  children: React.ReactNode;
};

function AppShellBody({ user, variant, avatarUrl, children }: AppShellLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar variant={variant} />
      <div className="ml-48 flex min-h-screen flex-col">
        <DashboardHeader user={user} variant={variant} avatarUrl={avatarUrl} />
        {user.emailConfirmed === false ? <VerifyEmailBanner /> : null}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export function AppShellLayout(props: AppShellLayoutProps) {
  if (props.variant === "admin") {
    return <AppShellBody {...props} />;
  }

  return (
    <MessagesProvider>
      <AppShellBody {...props} />
    </MessagesProvider>
  );
}
