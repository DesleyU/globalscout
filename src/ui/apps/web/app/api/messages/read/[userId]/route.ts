import { NextResponse } from "next/server";
import { createMessagesApi } from "@/lib/api/messages";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function PUT(_request: Request, context: RouteContext) {
  const { userId } = await context.params;

  try {
    const client = await createServerApiClient();
    const result = await createMessagesApi(client).markAsRead(userId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
