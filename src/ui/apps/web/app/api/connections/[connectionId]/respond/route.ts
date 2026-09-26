import { NextResponse } from "next/server";
import type { RespondToConnectionRequest } from "@globalscout/shared";
import { createConnectionsApi } from "@/lib/api/connections";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

type RouteContext = {
  params: Promise<{ connectionId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { connectionId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, message } = body as RespondToConnectionRequest;
  if (action !== "accept" && action !== "reject") {
    return NextResponse.json({ error: 'action must be "accept" or "reject"' }, { status: 400 });
  }

  try {
    const client = await createServerApiClient();
    const result = await createConnectionsApi(client).respondToRequest(connectionId, {
      action,
      message,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
