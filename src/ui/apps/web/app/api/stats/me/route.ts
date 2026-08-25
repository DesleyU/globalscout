import { NextResponse } from "next/server";
import { createStatsApi } from "@/lib/api/stats";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";
import { manualSeasonSchema } from "@/lib/validation/stats";

export async function GET() {
  try {
    const client = await createServerApiClient();
    const result = await createStatsApi(client).getMyStats();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}

export async function PUT(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = manualSeasonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const {
    season,
    competitions,
    shotsTotal,
    shotsOnTarget,
    passesTotal,
    passesAccuracy,
    tacklesTotal,
    tacklesInterceptions,
    duelsWon,
    foulsCommitted,
    foulsDrawn,
  } = parsed.data;

  try {
    const client = await createServerApiClient();
    const result = await createStatsApi(client).updateMyStats({
      season,
      competitions: competitions.map((row) => ({
        teamCatalogId: row.teamCatalogId,
        competitionCatalogId: row.competitionCatalogId,
        appearances: row.appearances,
        minutes: row.minutes,
        goals: row.goals,
        assists: row.assists,
        yellowCards: row.yellowCards,
        redCards: row.redCards,
        rating: row.rating,
      })),
      shotsTotal,
      shotsOnTarget,
      passesTotal,
      passesAccuracy,
      tacklesTotal,
      tacklesInterceptions,
      duelsWon,
      foulsCommitted,
      foulsDrawn,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
