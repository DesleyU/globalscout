import { NextResponse } from "next/server";
import { createConnectionsApi } from "@/lib/api/connections";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const page = Number(searchParams.get("page"));
  const limit = Number(searchParams.get("limit"));

  try {
    const client = await createServerApiClient();
    const result = await createConnectionsApi(client).getConnections({
      status: searchParams.get("status") ?? undefined,
      page: Number.isFinite(page) && page > 0 ? page : undefined,
      limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
