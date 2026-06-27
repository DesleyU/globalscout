import type { Metadata } from "next";
import { UsersPageClient } from "@/features/admin/users/users-page-client";
import { DEFAULT_ADMIN_USERS_FILTERS } from "@/features/admin/users/constants";
import { createAdminApi } from "@/lib/api/admin";
import { createServerApiClient } from "@/lib/api/server";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "User Management",
};

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const client = await createServerApiClient();
  const result = await createAdminApi(client).getUsers(
    DEFAULT_ADMIN_USERS_FILTERS,
  );

  return (
    <UsersPageClient
      initialData={result}
      initialFilters={DEFAULT_ADMIN_USERS_FILTERS}
      currentUserId={session.user.id}
    />
  );
}
