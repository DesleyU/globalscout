import { NextResponse } from "next/server";
import { createServerApiClient } from "@/lib/api/server";
import { createUsersApi } from "@/lib/api/users";
import { handleApiRouteError } from "@/lib/api/route-error";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { userId } = await context.params;

  try {
    const client = await createServerApiClient();
    const result = await createUsersApi(client).getAvatarUrl(userId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
