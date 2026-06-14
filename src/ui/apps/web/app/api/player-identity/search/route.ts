import { NextResponse } from "next/server";
import { createPlayerIdentityApi } from "@/lib/api/player-identity";
import { createServerApiClient } from "@/lib/api/server";
import { playerIdentitySearchSchema } from "@/lib/validation/player-identity";
import { handleApiRouteError } from "@/lib/api/route-error";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = playerIdentitySearchSchema.safeParse(body);
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
    const result = await createPlayerIdentityApi(client).searchPlayers(
      parsed.data,
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
