import { NextResponse } from "next/server";
import { createUsersApi } from "@/lib/api/users";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const page = Number(searchParams.get("page"));
  const limit = Number(searchParams.get("limit"));
  const minAge = Number(searchParams.get("minAge"));
  const maxAge = Number(searchParams.get("maxAge"));

  try {
    const client = await createServerApiClient();
    const result = await createUsersApi(client).searchUsers({
      q: searchParams.get("q") ?? undefined,
      role: searchParams.get("role") ?? undefined,
      position: searchParams.get("position") ?? undefined,
      club: searchParams.get("club") ?? undefined,
      country: searchParams.get("country") ?? undefined,
      city: searchParams.get("city") ?? undefined,
      minAge: Number.isFinite(minAge) && minAge > 0 ? minAge : undefined,
      maxAge: Number.isFinite(maxAge) && maxAge > 0 ? maxAge : undefined,
      page: Number.isFinite(page) && page > 0 ? page : undefined,
      limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
