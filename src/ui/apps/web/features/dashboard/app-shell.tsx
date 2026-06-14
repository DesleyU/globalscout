import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { requireSession } from "@/lib/auth";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar user={session.user} />
      <div className="ml-48 flex min-h-screen flex-col">
        <DashboardHeader user={session.user} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
