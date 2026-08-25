import { NextResponse } from "next/server";
import { createServerApiClient } from "@/lib/api/server";
import { createStatsApi } from "@/lib/api/stats";
import { handleApiRouteError } from "@/lib/api/route-error";

export async function POST() {
  try {
    const client = await createServerApiClient();
    const result = await createStatsApi(client).refresh();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
