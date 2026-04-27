/**
 * POST /api/gpa/add-course
 * Mirrors RicoGPA's POST /api/gpa/add-course exactly.
 *
 * Body — ONLY four fields accepted from the client:
 *   { name, year, courseType, grade }
 *
 * Server computes:
 *   creditHours = courseType === "Half" ? 0.5 : 1
 *   gradePoints = GRADE_MAP[grade] * creditHours
 *
 * Any client-supplied creditHours / gradePoints values are ignored.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GRADE_MAP, COURSE_TYPES, unitsFor, gradePointsFor } from "@/lib/gpa";

const YEARS = new Set(["Year 1", "Year 2", "Year 3", "Year 4"]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const year = typeof body.year === "string" ? body.year : "";
  const courseType = typeof body.courseType === "string" ? body.courseType : "";
  const grade = typeof body.grade === "string" ? body.grade : "";

  if (!name || !year || !courseType || !grade) {
    return NextResponse.json(
      { message: "All fields are required" },
      { status: 400 }
    );
  }
  if (!YEARS.has(year)) {
    return NextResponse.json({ message: "Invalid year" }, { status: 400 });
  }
  if (!(COURSE_TYPES as readonly string[]).includes(courseType)) {
    return NextResponse.json({ message: "Invalid course type" }, { status: 400 });
  }
  if (GRADE_MAP[grade] === undefined) {
    return NextResponse.json({ message: "Invalid grade" }, { status: 400 });
  }

  const creditHours = unitsFor(courseType);
  const gradePoints = gradePointsFor(grade, courseType)!;

  const course = await db.gpaCourse.create({
    data: {
      userId: session.user.id,
      name,
      year,
      courseType,
      creditHours,
      grade,
      gradePoints,
    },
  });

  return NextResponse.json(course, { status: 201 });
}
