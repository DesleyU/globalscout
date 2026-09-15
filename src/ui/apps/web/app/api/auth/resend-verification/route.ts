import { isApiError } from "@globalscout/shared";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAuthApi } from "@/lib/api/auth";
import { createWebApiClient } from "@/lib/api/client";
import { getPublicApiBaseUrl } from "@/lib/env";
import { AUTH_TOKEN_COOKIE } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = createWebApiClient({
    baseUrl: getPublicApiBaseUrl(),
    getAuthToken: () => token,
  });

  try {
    const result = await createAuthApi(client).resendVerification();
    return NextResponse.json({ message: result.message });
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
    return NextResponse.json({ error: "Could not resend verification email" }, { status: 500 });
  }
}
