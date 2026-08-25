import { NextResponse } from "next/server";
import { createMediaApi } from "@/lib/api/media";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

type RouteContext = {
  params: Promise<{ videoId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { videoId } = await context.params;

  try {
    const client = await createServerApiClient();
    const result = await createMediaApi(client).deleteVideo(videoId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
