import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { getSession, deleteSession, updateSessionMeta } from "@/services/ai/tutorService";
import { NotFoundError, ForbiddenError } from "@/lib/errors";
import type { TutorMode } from "@/generated/prisma/client";

export const runtime = "nodejs";

const patchSchema = z.object({
  title: z.string().optional(),
  mode: z
    .enum([
      "LEARN", "PRACTICE", "REVISION", "DIRECT",
      "GENERAL", "CODE", "WRITE", "RESEARCH", "BUSINESS",
    ] as const)
    .optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const auth_ = await auth();
  if (!auth_?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  try {
    const session = await getSession(auth_.user.id, sessionId);
    return NextResponse.json(session);
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (err instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw err;
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const auth_ = await auth();
  if (!auth_?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const updated = await updateSessionMeta({
      userId: auth_.user.id,
      sessionId,
      title: body.title,
      mode: body.mode as TutorMode | undefined,
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (err instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw err;
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const auth_ = await auth();
  if (!auth_?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  try {
    await deleteSession(auth_.user.id, sessionId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof NotFoundError) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (err instanceof ForbiddenError) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    throw err;
  }
}
