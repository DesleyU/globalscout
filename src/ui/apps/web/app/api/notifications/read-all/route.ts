import { NextResponse } from "next/server";
import { createNotificationsApi } from "@/lib/api/notifications";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

export async function PUT() {
  try {
    const client = await createServerApiClient();
    const result = await createNotificationsApi(client).markAllRead();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
