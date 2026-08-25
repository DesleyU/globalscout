import { NextResponse } from "next/server";
import { withAdminApiClient } from "@/lib/api/admin-route";

type RouteContext = {
  params: Promise<{ countryCode: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { countryCode } = await context.params;

  return withAdminApiClient((admin) =>
    admin.getReferenceDataCountryCompetitions(countryCode),
  );
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
