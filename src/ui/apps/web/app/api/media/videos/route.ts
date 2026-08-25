import { NextResponse } from "next/server";
import { createMediaApi } from "@/lib/api/media";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

export async function GET() {
  try {
    const client = await createServerApiClient();
    const result = await createMediaApi(client).getMyVideos();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
