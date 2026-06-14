import { NextResponse } from "next/server";
import type { AdminPlayerClaimRequiredNoteRequest } from "@globalscout/shared";
import { withAdminApiClient } from "@/lib/api/admin-route";

type RouteContext = {
  params: Promise<{ claimId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { claimId } = await context.params;
  const body = (await request.json()) as AdminPlayerClaimRequiredNoteRequest;

  return withAdminApiClient((admin) => admin.rejectPlayerClaim(claimId, body));
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
