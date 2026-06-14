import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;

export function getAuthCookieOptions(
  maxAge = ONE_WEEK_SECONDS,
): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}
