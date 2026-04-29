import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { createSession, listSessions } from "@/services/ai/tutorService";
import type { TutorMode } from "@/generated/prisma/client";

export const runtime = "nodejs";

const createSchema = z.object({
  courseId: z.string().optional(),
  mode: z
    .enum([
      "LEARN", "PRACTICE", "REVISION", "DIRECT",
      "GENERAL", "CODE", "WRITE", "RESEARCH", "BUSINESS",
    ] as const)
    .default("GENERAL"),
  title: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const courseId = url.searchParams.get("courseId") ?? undefined;
  const sessions = await listSessions(session.user.id, courseId);
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const newSession = await createSession({
    userId: session.user.id,
    courseId: body.courseId ?? null,
    mode: body.mode as TutorMode,
    title: body.title,
  });

  return NextResponse.json(newSession, { status: 201 });
}
