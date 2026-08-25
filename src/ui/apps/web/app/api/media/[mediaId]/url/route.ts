import { NextResponse } from "next/server";
import { createMediaApi } from "@/lib/api/media";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

type RouteContext = {
  params: Promise<{ mediaId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { mediaId } = await context.params;

  try {
    const client = await createServerApiClient();
    const result = await createMediaApi(client).getMediaUrl(mediaId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
