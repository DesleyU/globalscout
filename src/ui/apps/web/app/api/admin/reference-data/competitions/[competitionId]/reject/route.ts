import { NextResponse } from "next/server";
import { withAdminApiClient } from "@/lib/api/admin-route";

type RouteContext = {
  params: Promise<{ competitionId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { competitionId } = await context.params;

  return withAdminApiClient((admin) =>
    admin.rejectReferenceDataCompetition(competitionId),
  );
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
