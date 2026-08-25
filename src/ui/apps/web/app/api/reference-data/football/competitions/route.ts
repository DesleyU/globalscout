import { NextResponse } from "next/server";
import { createReferenceDataApi } from "@/lib/api/reference-data";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";
import {
  listFootballCompetitionsSchema,
  submitFootballCompetitionSchema,
} from "@/lib/validation/reference-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listFootballCompetitionsSchema.safeParse({
    country: url.searchParams.get("country") ?? "",
    level: url.searchParams.get("level") ?? undefined,
  });

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
    const result = await createReferenceDataApi(client).listCompetitions(
      parsed.data.country,
      parsed.data.level,
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = submitFootballCompetitionSchema.safeParse(body);
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
    const result = await createReferenceDataApi(client).submitCompetition({
      country: parsed.data.country,
      name: parsed.data.name,
      levelHint: parsed.data.levelHint,
      typeHint: parsed.data.typeHint,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiRouteError(error);
  }
}
