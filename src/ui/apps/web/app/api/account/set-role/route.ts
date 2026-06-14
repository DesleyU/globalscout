import { isApiError } from "@globalscout/shared";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAccountApi } from "@/lib/api/account";
import { createWebApiClient } from "@/lib/api/client";
import { getPublicApiBaseUrl } from "@/lib/env";
import {
  AUTH_TOKEN_COOKIE,
  getAuthCookieOptions,
  getPostAuthRedirect,
} from "@/lib/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const role =
    typeof body === "object" &&
    body !== null &&
    "role" in body &&
    typeof (body as { role: unknown }).role === "string"
      ? (body as { role: string }).role
      : null;

  if (!role?.trim()) {
    return NextResponse.json({ error: "Role is required" }, { status: 400 });
  }

  const client = createWebApiClient({
    baseUrl: getPublicApiBaseUrl(),
    getAuthToken: () => token,
  });

  try {
    const result = await createAccountApi(client).setRole({ role: role.trim() });

    const redirectTo = await getPostAuthRedirect(result.user.role, result.token);

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
    return NextResponse.json({ error: "Failed to set account role" }, { status: 500 });
  }
}
