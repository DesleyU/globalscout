import { NextResponse } from "next/server";
import { createMediaApi } from "@/lib/api/media";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";
import { completeVideoUploadBodySchema } from "@/lib/validation/media";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = completeVideoUploadBodySchema.safeParse(body);
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
    const result = await createMediaApi(client).completeVideoUpload(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
