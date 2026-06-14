import { NextResponse } from "next/server";
import { createServerApiClient } from "@/lib/api/server";
import { uploadEvidenceFile } from "@/lib/storage/evidence-upload";
import { handleApiRouteError } from "@/lib/api/route-error";
import { z } from "zod";
import { evidenceTypes } from "@globalscout/shared";

const uploadSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  contentLength: z.number().int().positive(),
  fileBase64: z.string().min(1),
  type: z.enum(evidenceTypes),
  note: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = uploadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const binary = Buffer.from(parsed.data.fileBase64, "base64");
    const file = new File([binary], parsed.data.fileName, {
      type: parsed.data.contentType,
    });
    const client = await createServerApiClient();
    const result = await uploadEvidenceFile({
      client,
      file,
      type: parsed.data.type,
      note: parsed.data.note,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiRouteError(error);
  }
}
