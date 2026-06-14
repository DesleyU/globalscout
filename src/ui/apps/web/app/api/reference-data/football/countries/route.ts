import { NextResponse } from "next/server";
import { createReferenceDataApi } from "@/lib/api/reference-data";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";

export async function GET() {
  try {
    const client = await createServerApiClient();
    const result = await createReferenceDataApi(client).getCountries();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
