import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 60;

const SPLASH_AI_URL = process.env.SPLASH_AI_API_URL ?? "http://localhost:3001";
const SPLASH_AI_KEY = process.env.SPLASH_AI_API_KEY ?? "";

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

  const { question, materialIds } = await req.json();
  if (!question?.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }

  // Fetch requested materials (or all if none specified)
  const whereClause =
    Array.isArray(materialIds) && materialIds.length > 0
      ? { courseId: course.id, id: { in: materialIds as string[] } }
      : { courseId: course.id };

  const materials = await db.courseMaterial.findMany({
    where: whereClause,
    select: { id: true, title: true, filename: true, extractedText: true },
    take: 5, // max 5 materials to keep within context window
  });

  const richMaterials = materials.map((m) => ({
    id: m.id,
    title: m.title,
    filename: m.filename,
    text: m.extractedText,
  }));

  try {
    const res = await fetch(`${SPLASH_AI_URL}/api/academy/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SPLASH_AI_KEY}`,
      },
      body: JSON.stringify({
        courseId: course.id,
        courseName: course.title,
        question,
        materials: richMaterials,
        studentLevel: "university",
      }),
      signal: AbortSignal.timeout(55_000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as { error?: string }).error ?? `Splash AI returned ${res.status}`;
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
      {
        error:
          "Could not reach Splash AI. Make sure it is running at " + SPLASH_AI_URL,
      },
      { status: 503 }
    );
  }
}
