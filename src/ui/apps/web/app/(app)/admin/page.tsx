import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createAdminApi } from "@/lib/api/admin";
import { createServerApiClient } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Admin Overview",
};

export default async function AdminOverviewPage() {
  const client = await createServerApiClient();
  const { stats } = await createAdminApi(client).getStats();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-6 py-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          <LayoutDashboard className="size-4" />
          Admin
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">
          Platform health at a glance. Jump into a section to take action.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total users</CardTitle>
            <CardDescription>Registered accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.users.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active</CardTitle>
            <CardDescription>Accounts in good standing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-emerald-600">
              {stats.users.active}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Blocked</CardTitle>
            <CardDescription>Restricted accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-red-600">
              {stats.users.blocked}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Connections</CardTitle>
            <CardDescription>
              {stats.connections.accepted} accepted, {stats.connections.pending}{" "}
              pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{stats.connections.total}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.users.byRole.players}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clubs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.users.byRole.clubs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Scouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.users.byRole.scouts}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <CardTitle>Player Claims</CardTitle>
            </div>
            <CardDescription>
              Review and approve player identity verification requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/admin/player-claims" />}>
              Open claims queue
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <CardTitle>User Management</CardTitle>
            </div>
            <CardDescription>
              Browse users, block accounts, or remove users from the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/admin/users" />}>
              Manage users
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
