import { NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE, getAuthCookieOptions, getPostAuthRedirect } from "@/lib/auth";
import { createAuthApi } from "@/lib/api/auth";
import { createWebApiClient } from "@/lib/api/client";
import { getPublicApiBaseUrl } from "@/lib/env";

/** Reason codes the API's callback endpoint form_posts; see contracts/api-auth-external.md. */
const KNOWN_ERROR_REASONS = new Set([
  "under_age",
  "email_in_use",
  "provider_error",
  "access_denied",
]);

/**
 * Target of the API's self-submitting form_post page (GetAuthExternalCallback). The API deliberately
 * never puts the JWT or the handoff code in a redirect URL - it POSTs one of `code`/`error` here as a
 * form body instead, which this route (running server-side) exchanges for the JWT and sets as the
 * existing AUTH_TOKEN_COOKIE, exactly as app/api/auth/sign-in/route.ts does for password sign-in.
 */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return signInRedirect(origin, "provider_error");
  }

  const error = form.get("error");
  if (typeof error === "string") {
    const reason = KNOWN_ERROR_REASONS.has(error) ? error : "provider_error";
    return signInRedirect(origin, reason);
  }

  const code = form.get("code");
  if (typeof code !== "string" || code.length === 0) {
    return signInRedirect(origin, "provider_error");
  }

  const client = createWebApiClient({ baseUrl: getPublicApiBaseUrl() });

  try {
    const result = await createAuthApi(client).exchangeExternalCode({ code });

    const redirectTo = await getPostAuthRedirect(result.user.role, result.token);

    const response = NextResponse.redirect(`${origin}${redirectTo}`, { status: 303 });
    response.cookies.set(AUTH_TOKEN_COOKIE, result.token, getAuthCookieOptions());

    return response;
  } catch {
    // A used/expired/unknown handoff code (the exchange endpoint's 400) or a network failure both land
    // here; either way there is no session to establish, so send the person back to try again (FR-012).
    return signInRedirect(origin, "provider_error");
  }
}

function signInRedirect(origin: string, reason: string) {
  return NextResponse.redirect(`${origin}/sign-in?error=${reason}`, { status: 303 });
}
