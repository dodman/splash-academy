import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 90;

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

  const { topic, numberOfQuestions, difficulty, questionType, materialIds } =
    await req.json();

  // Gather materials
  const whereClause =
    Array.isArray(materialIds) && materialIds.length > 0
      ? { courseId: course.id, id: { in: materialIds as string[] } }
      : { courseId: course.id };

  const materials = await db.courseMaterial.findMany({
    where: whereClause,
    select: { id: true, title: true, filename: true, extractedText: true },
    take: 5,
  });

  const richMaterials = materials.map((m) => ({
    id: m.id,
    title: m.title,
    filename: m.filename,
    text: m.extractedText,
  }));

  try {
    const res = await fetch(`${SPLASH_AI_URL}/api/academy/generate-quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SPLASH_AI_KEY}`,
      },
      body: JSON.stringify({
        courseId: course.id,
        courseName: course.title,
        topic: topic || undefined,
        materials: richMaterials,
        numberOfQuestions: numberOfQuestions ?? 5,
        difficulty: difficulty ?? "medium",
        questionType: questionType ?? "multiple-choice",
      }),
      signal: AbortSignal.timeout(85_000),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as { error?: string }).error ?? `Splash AI returned ${res.status}`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const data = await res.json();
    const quiz = data.quiz;

    // Save to database
    const saved = await db.generatedQuiz.create({
      data: {
        courseId: course.id,
        topic: topic || null,
        difficulty: difficulty ?? "medium",
        questionType: questionType ?? "multiple-choice",
        questions: quiz,
        generatedBy: session.user.id,
      },
    });

    return NextResponse.json({ quiz, quizId: saved.id });
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
