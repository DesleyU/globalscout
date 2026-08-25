import { NextResponse } from "next/server";
import { withAdminApiClient } from "@/lib/api/admin-route";

export async function GET() {
  return withAdminApiClient((admin) => admin.getReferenceDataCountries());
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
