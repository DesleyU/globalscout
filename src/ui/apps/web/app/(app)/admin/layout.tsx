import { AdminAppShell } from "@/features/admin/admin-app-shell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireAdmin();

  return (
    <AdminAppShell user={session.user}>
      <div className="flex min-h-full flex-1 flex-col bg-muted/20">
        {children}
      </div>
    </AdminAppShell>
  );
}
