/**
 * POST /api/gpa/ask-ai
 * Sends the logged-in user's GPA data + their question to Splash AI
 * (POST /api/academy/gpa-advice) and returns the structured advice.
 *
 * Body:
 *   question: string
 *
 * Response:
 *   { answer: string, recommendations: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calcGPA, getClassification } from "@/lib/gpa";

export const runtime = "nodejs";
export const maxDuration = 60;

const SPLASH_AI_URL = process.env.SPLASH_AI_API_URL ?? "http://localhost:3001";
const SPLASH_AI_KEY = process.env.SPLASH_AI_API_KEY ?? "";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { question } = await req.json();
  if (!question || typeof question !== "string" || !question.trim()) {
    return NextResponse.json({ error: "Question is required" }, { status: 400 });
  }
  if (question.length > 2000) {
    return NextResponse.json({ error: "Question too long (max 2000 chars)" }, { status: 400 });
  }

  // Build the user's GPA snapshot
  const courses = await db.gpaCourse.findMany({
    where: { userId: session.user.id },
    orderBy: [{ year: "asc" }, { createdAt: "asc" }],
  });

  const { gpa: cumulativeGPA, totalCredits } = calcGPA(courses);
  const classification = getClassification(cumulativeGPA);

  // Build yearly breakdown
  const byYear: Record<string, { gpa: number; credits: number; classification: string }> = {};
  const grouped: Record<string, typeof courses> = {};
  for (const c of courses) {
    if (!grouped[c.year]) grouped[c.year] = [];
    grouped[c.year].push(c);
  }
  for (const [year, yearCourses] of Object.entries(grouped)) {
    const yc = calcGPA(yearCourses);
    byYear[year] = {
      gpa: yc.gpa,
      credits: yc.totalCredits,
      classification: getClassification(yc.gpa),
    };
  }

  const payload = {
    studentName: session.user.name ?? undefined,
    gpaSummary: {
      cumulativeGPA,
      totalCredits,
      classification,
      yearlyBreakdown: byYear,
    },
    courses: courses.map((c) => ({
      name: c.name,
      year: c.year,
      semester: c.semester,
      courseType: c.courseType,
      creditHours: c.creditHours,
      grade: c.grade,
      gradePoints: c.gradePoints,
    })),
    question,
  };

  try {
    const res = await fetch(`${SPLASH_AI_URL}/api/academy/gpa-advice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SPLASH_AI_KEY}`,
      },
      body: JSON.stringify(payload),
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
