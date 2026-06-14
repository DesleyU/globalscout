import { isApiError } from "@globalscout/shared";
import { NextResponse } from "next/server";
import {
  AUTH_TOKEN_COOKIE,
  getAuthCookieOptions,
  getPostAuthRedirect,
} from "@/lib/auth";
import { createAuthApi } from "@/lib/api/auth";
import { createWebApiClient } from "@/lib/api/client";
import { getPublicApiBaseUrl } from "@/lib/env";
import { signInSchema } from "@/lib/validation/sign-in";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const client = createWebApiClient({ baseUrl: getPublicApiBaseUrl() });

  try {
    const result = await createAuthApi(client).login(parsed.data);

    const redirectTo = await getPostAuthRedirect(
      result.user.role,
      result.token,
    );

    const response = NextResponse.json({
      user: result.user,
      redirectTo,
    });
    response.cookies.set(
      AUTH_TOKEN_COOKIE,
      result.token,
      getAuthCookieOptions(),
    );

    return response;
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          ...(process.env.NODE_ENV === "development"
            ? {
                apiBaseUrl: getPublicApiBaseUrl(),
                ...(error.kind === "network"
                  ? {
                      hint: "Next.js could not reach the API. Check NEXT_PUBLIC_API_BASE_URL and that the API is running.",
                    }
                  : {}),
              }
            : {}),
        },
        { status: error.status || 401 },
      );
    }
    return NextResponse.json({ error: "Sign in failed" }, { status: 500 });
  }
}
