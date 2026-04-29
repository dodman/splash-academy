/**
 * POST /api/courses/[slug]/summarize-material
 * Calls Splash AI /api/academy/summarize-material with the extracted text
 * of one (or all) course materials and returns a structured summary.
 *
 * Body:
 *   materialId   string?   – ID of a specific material to summarise.
 *                            If omitted, all materials are concatenated (up to 60k chars).
 *   summaryType  string    – "short" | "detailed" | "revision-notes"  (default: "short")
 *
 * Response (from Splash AI, passed through):
 *   { summary, keyPoints: string[], possibleExamQuestions: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 90;

const SPLASH_AI_URL = process.env.SPLASH_AI_API_URL ?? "http://localhost:3001";
const SPLASH_AI_KEY = process.env.SPLASH_AI_API_KEY ?? "";

const VALID_TYPES = new Set(["short", "detailed", "revision-notes"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const course = await db.course.findUnique({
    where: { slug },
    select: { id: true, title: true, instructorId: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Must be enrolled or instructor/admin
  const isInstructor = course.instructorId === session.user.id;
  const role = session.user.role as string | undefined;
  const isAdminRole = role === "ADMIN" || role === "OVERALL_ADMIN";
  if (!isInstructor && !isAdminRole) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const materialId: string | undefined = body.materialId;
  const summaryType: string = VALID_TYPES.has(body.summaryType) ? body.summaryType : "short";

  // Fetch materials
  let materials;
  if (materialId) {
    materials = await db.courseMaterial.findMany({
      where: { id: materialId, courseId: course.id },
      select: { id: true, title: true, filename: true, extractedText: true },
    });
  } else {
    materials = await db.courseMaterial.findMany({
      where: { courseId: course.id },
      select: { id: true, title: true, filename: true, extractedText: true },
      orderBy: { createdAt: "asc" },
      take: 5,
    });
  }

  if (materials.length === 0) {
    return NextResponse.json(
      { error: "No materials found. Upload course materials first." },
      { status: 404 }
    );
  }

  // Concatenate text (cap at 60 000 chars — Splash AI's limit)
  const MAX_CHARS = 60_000;
  const separator = "\n\n---\n\n";
  let combinedText = "";
  let materialTitle: string | undefined;

  if (materials.length === 1) {
    combinedText = materials[0].extractedText.slice(0, MAX_CHARS);
    materialTitle = materials[0].title;
  } else {
    for (const m of materials) {
      const block = `[${m.title}]\n${m.extractedText}`;
      if (combinedText.length + block.length + separator.length > MAX_CHARS) {
        const remaining = MAX_CHARS - combinedText.length - separator.length;
        if (remaining > 200) combinedText += separator + block.slice(0, remaining);
        break;
      }
      combinedText += (combinedText ? separator : "") + block;
    }
    materialTitle = `${materials.length} materials`;
  }

  if (combinedText.trim().length < 20) {
    return NextResponse.json(
      { error: "Material text is too short to summarise." },
      { status: 422 }
    );
  }

  try {
    const res = await fetch(`${SPLASH_AI_URL}/api/academy/summarize-material`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SPLASH_AI_KEY}`,
      },
      body: JSON.stringify({
        courseId: course.id,
        courseName: course.title,
        materialTitle,
        text: combinedText,
        summaryType,
      }),
      signal: AbortSignal.timeout(85_000),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = (errBody as { error?: string }).error ?? `Splash AI returned ${res.status}`;
      if (res.status === 401) {
        return NextResponse.json(
          { error: "AI service authentication failed. Check SPLASH_AI_API_KEY." },
          { status: 502 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      return NextResponse.json({ error: "Splash AI timed out. Try again." }, { status: 504 });
    }
    return NextResponse.json(
      { error: "Could not reach Splash AI. Make sure it is running at " + SPLASH_AI_URL },
      { status: 503 }
    );
  }
}
