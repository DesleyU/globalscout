import { NextResponse } from "next/server";
import { createUsersApi } from "@/lib/api/users";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const page = Number(searchParams.get("page"));
  const limit = Number(searchParams.get("limit"));

  try {
    const client = await createServerApiClient();
    const result = await createUsersApi(client).searchUsers({
      q: searchParams.get("q") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      page: Number.isFinite(page) && page > 0 ? page : undefined,
      limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
