import { NextResponse } from "next/server";
import { createMessagesApi } from "@/lib/api/messages";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

export async function GET() {
  try {
    const client = await createServerApiClient();
    const result = await createMessagesApi(client).getConversations();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
