import { isApiError } from "@globalscout/shared";
import { NextResponse } from "next/server";

export function handleApiRouteError(error: unknown) {
  if (isApiError(error)) {
    const body: Record<string, unknown> = {
      error: error.message,
    };

    if (error.code) {
      body.code = error.code;
    }

    const problem = error.problem;
    if (problem) {
      if (typeof problem.message === "string") {
        body.message = problem.message;
      }
      if (problem.limit !== undefined) {
        body.limit = problem.limit;
      }
      if (problem.current !== undefined) {
        body.current = problem.current;
      }
    }

    return NextResponse.json(body, { status: error.status || 500 });
  }

  return NextResponse.json({ error: "Request failed" }, { status: 500 });
}
