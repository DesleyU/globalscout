import { NextResponse } from "next/server";
import type { UpdateAdminUserStatusRequest } from "@globalscout/shared";
import { withAdminApiClient } from "@/lib/api/admin-route";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { userId } = await context.params;
  const body = (await request.json()) as UpdateAdminUserStatusRequest;

  return withAdminApiClient((admin) =>
    admin.updateUserStatus(userId, body.status),
  );
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
