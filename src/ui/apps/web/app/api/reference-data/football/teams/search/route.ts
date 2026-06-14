import { NextResponse } from "next/server";
import { createReferenceDataApi } from "@/lib/api/reference-data";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";
import { searchFootballTeamsSchema } from "@/lib/validation/reference-data";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = searchFootballTeamsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const client = await createServerApiClient();
    const result = await createReferenceDataApi(client).searchTeams(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
