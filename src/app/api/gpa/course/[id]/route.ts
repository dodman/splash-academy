/**
 * PUT    /api/gpa/course/[id] — edit a course (name | year | courseType | grade)
 * DELETE /api/gpa/course/[id] — delete a course
 *
 * For PUT: server recomputes creditHours and gradePoints whenever
 * courseType or grade changes. The client never supplies those values.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GRADE_MAP, COURSE_TYPES, unitsFor, gradePointsFor } from "@/lib/gpa";

const YEARS = new Set(["Year 1", "Year 2", "Year 3", "Year 4"]);

async function loadOwned(userId: string, id: string) {
  const course = await db.gpaCourse.findFirst({ where: { id, userId } });
  return course;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await loadOwned(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ message: "Course not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Only these four fields are accepted from the client
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const year = typeof body.year === "string" ? body.year : undefined;
  const courseType = typeof body.courseType === "string" ? body.courseType : undefined;
  const grade = typeof body.grade === "string" ? body.grade : undefined;

  if (year !== undefined && !YEARS.has(year)) {
    return NextResponse.json({ message: "Invalid year" }, { status: 400 });
  }
  if (
    courseType !== undefined &&
    !(COURSE_TYPES as readonly string[]).includes(courseType)
  ) {
    return NextResponse.json({ message: "Invalid course type" }, { status: 400 });
  }
  if (grade !== undefined && GRADE_MAP[grade] === undefined) {
    return NextResponse.json({ message: "Invalid grade" }, { status: 400 });
  }

  // Resolve final values (use existing as fallback)
  const finalCourseType = courseType ?? existing.courseType;
  const finalGrade = grade ?? existing.grade;
  const finalCreditHours = unitsFor(finalCourseType);
  const finalGradePoints = gradePointsFor(finalGrade, finalCourseType)!;

  const updated = await db.gpaCourse.update({
    where: { id },
    data: {
      ...(name !== undefined && name !== "" && { name }),
      ...(year !== undefined && { year }),
      courseType: finalCourseType,
      grade: finalGrade,
      creditHours: finalCreditHours,
      gradePoints: finalGradePoints,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await loadOwned(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ message: "Course not found" }, { status: 404 });
  }
  await db.gpaCourse.delete({ where: { id } });
  return NextResponse.json({ message: "Course deleted" });
}
