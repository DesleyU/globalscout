import { isApiError } from "@globalscout/shared";
import { NextResponse } from "next/server";
import { createAuthApi } from "@/lib/api/auth";
import { createWebApiClient } from "@/lib/api/client";
import { getPublicApiBaseUrl } from "@/lib/env";
import {
  AUTH_TOKEN_COOKIE,
  getAuthCookieOptions,
  getPostAuthRedirect,
} from "@/lib/auth";
import { registerSchema, toRegisterRequest } from "@/lib/validation/register";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
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
    const payload = toRegisterRequest(parsed.data);
    const result = await createAuthApi(client).register({
      email: payload.email,
      password: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
    });

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
        },
        { status: error.status || 400 },
      );
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
