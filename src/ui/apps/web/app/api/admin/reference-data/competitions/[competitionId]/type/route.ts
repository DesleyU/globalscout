import { NextResponse } from "next/server";
import { withAdminApiClient } from "@/lib/api/admin-route";

type RouteContext = {
  params: Promise<{ competitionId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { competitionId } = await context.params;
  const body = (await request.json()) as { type: string };

  return withAdminApiClient((admin) =>
    admin.setReferenceDataCompetitionType(competitionId, body),
  );
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
