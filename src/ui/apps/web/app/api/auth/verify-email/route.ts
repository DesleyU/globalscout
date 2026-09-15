import { isApiError } from "@globalscout/shared";
import { NextResponse } from "next/server";
import { createAuthApi } from "@/lib/api/auth";
import { createWebApiClient } from "@/lib/api/client";
import { getPublicApiBaseUrl } from "@/lib/env";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token =
    typeof body === "object" &&
    body !== null &&
    "token" in body &&
    typeof (body as { token: unknown }).token === "string"
      ? (body as { token: string }).token
      : null;

  if (!token?.trim()) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const client = createWebApiClient({ baseUrl: getPublicApiBaseUrl() });

  try {
    const result = await createAuthApi(client).verifyEmail({ token });
    return NextResponse.json({
      message: result.message,
      alreadyVerified: result.alreadyVerified,
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status || 400 },
      );
    }
    return NextResponse.json({ error: "Email verification failed" }, { status: 500 });
  }
}
