import { NextResponse } from "next/server";
import { createMediaApi } from "@/lib/api/media";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

type RouteContext = {
  params: Promise<{ photoId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { photoId } = await context.params;

  try {
    const client = await createServerApiClient();
    const result = await createMediaApi(client).deletePhoto(photoId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
