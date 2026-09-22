import { NextResponse } from "next/server";
import { createNotificationsApi } from "@/lib/api/notifications";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

type RouteContext = {
  params: Promise<{ notificationId: string }>;
};

export async function PUT(_request: Request, context: RouteContext) {
  const { notificationId } = await context.params;

  try {
    const client = await createServerApiClient();
    const result = await createNotificationsApi(client).markRead(notificationId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
