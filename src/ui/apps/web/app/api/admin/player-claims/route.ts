import { NextResponse } from "next/server";
import type { ListAdminPlayerClaimsParams } from "@globalscout/shared";
import { withAdminApiClient } from "@/lib/api/admin-route";

function parseListParams(searchParams: URLSearchParams): ListAdminPlayerClaimsParams {
  const page = Number(searchParams.get("page"));
  const limit = Number(searchParams.get("limit"));

  return {
    status: searchParams.get("status") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
  };
}

export async function GET(request: Request) {
  const params = parseListParams(new URL(request.url).searchParams);

  return withAdminApiClient((admin) => admin.listPlayerClaims(params));
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
