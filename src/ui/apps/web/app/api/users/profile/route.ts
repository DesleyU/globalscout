import { NextResponse } from "next/server";
import { createUsersApi } from "@/lib/api/users";
import { createServerApiClient } from "@/lib/api/server";
import { handleApiRouteError } from "@/lib/api/route-error";
import { profileEditSchema } from "@/lib/validation/profile";

export async function PUT(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = profileEditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const payload = {
    ...parsed.data,
    website: parsed.data.website || null,
  };

  try {
    const client = await createServerApiClient();
    const result = await createUsersApi(client).updateProfile(payload);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
