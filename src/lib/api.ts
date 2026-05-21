import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";

type ParseSuccess<T> = { ok: true; data: T };
type ParseFailure = { ok: false; response: NextResponse };

export async function parseRequest<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<ParseSuccess<T> | ParseFailure> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

export function assertDraft(status: string): NextResponse | null {
  if (status !== "draft") {
    return NextResponse.json(
      { error: "Can only edit items on a draft proposal" },
      { status: 409 },
    );
  }
  return null;
}
