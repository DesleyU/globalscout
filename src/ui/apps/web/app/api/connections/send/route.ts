import { NextResponse } from "next/server";
import type { SendConnectionRequest } from "@globalscout/shared";
import { createConnectionsApi } from "@/lib/api/connections";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { receiverId, message } = body as SendConnectionRequest;
  if (!receiverId) {
    return NextResponse.json({ error: "receiverId is required" }, { status: 400 });
  }

  try {
    const client = await createServerApiClient();
    const result = await createConnectionsApi(client).sendRequest({ receiverId, message });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
