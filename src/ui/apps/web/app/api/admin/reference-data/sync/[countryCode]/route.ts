import { NextResponse } from "next/server";
import { withAdminApiClient } from "@/lib/api/admin-route";

type RouteContext = {
  params: Promise<{ countryCode: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { countryCode } = await context.params;

  return withAdminApiClient((admin) =>
    admin.syncCountryReferenceData(countryCode),
  );
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
