import { NextResponse } from "next/server";
import { createMessagesApi } from "@/lib/api/messages";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { userId } = await context.params;
  const searchParams = new URL(request.url).searchParams;
  const page = Number(searchParams.get("page"));
  const limit = Number(searchParams.get("limit"));

  try {
    const client = await createServerApiClient();
    const result = await createMessagesApi(client).getConversation(userId, {
      page: Number.isFinite(page) && page > 0 ? page : undefined,
      limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
