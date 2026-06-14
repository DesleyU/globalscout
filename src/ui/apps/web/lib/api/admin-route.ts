import { NextResponse } from "next/server";
import { createAdminApi } from "@/lib/api/admin";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";
import { getSession } from "@/lib/auth/get-session";
import { isAdminUser } from "@/lib/auth/is-admin";

export async function requireAdminApiSession() {
  const session = await getSession();

  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as const;
  }

  if (!isAdminUser(session.user)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    } as const;
  }

  return { session } as const;
}

export async function withAdminApiClient<T>(
  handler: (adminApi: ReturnType<typeof createAdminApi>) => Promise<T>,
) {
  const auth = await requireAdminApiSession();
  if ("error" in auth) {
    return auth.error;
  }

  try {
    const client = await createServerApiClient();
    const result = await handler(createAdminApi(client));
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
