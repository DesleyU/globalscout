import { isApiError } from "@globalscout/shared";
import { NextResponse } from "next/server";

export function handleApiRouteError(error: unknown) {
  if (isApiError(error)) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.status || 500 },
    );
  }

  return NextResponse.json({ error: "Request failed" }, { status: 500 });
}
