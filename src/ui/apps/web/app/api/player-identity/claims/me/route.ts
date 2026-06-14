import { NextResponse } from "next/server";
import { createPlayerIdentityApi } from "@/lib/api/player-identity";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

export async function GET() {
  try {
    const client = await createServerApiClient();
    const result = await createPlayerIdentityApi(client).getMyClaim();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
