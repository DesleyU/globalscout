import { NextResponse } from "next/server";
import { createStatsApi } from "@/lib/api/stats";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

type RouteContext = {
  params: Promise<{ season: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { season } = await context.params;

  if (!/^\d{4}$/.test(season)) {
    return NextResponse.json({ error: "Invalid season" }, { status: 400 });
  }

  try {
    const client = await createServerApiClient();
    const result = await createStatsApi(client).deleteMySeason(season);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
