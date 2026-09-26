import { NextResponse } from "next/server";
import type { SendMessageRequest } from "@globalscout/shared";
import { createMessagesApi } from "@/lib/api/messages";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { receiverId, content } = body as SendMessageRequest;
  if (!receiverId || !content) {
    return NextResponse.json({ error: "receiverId and content are required" }, { status: 400 });
  }

  try {
    const client = await createServerApiClient();
    const result = await createMessagesApi(client).sendMessage({ receiverId, content });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
