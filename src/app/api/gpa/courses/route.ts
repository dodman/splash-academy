import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GRADE_MAP } from "@/lib/gpa";

// GET /api/gpa/courses — list all GPA courses for user + dashboard summary
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = await db.gpaCourse.findMany({
    where: { userId: session.user.id },
    orderBy: [{ year: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(courses);
}

// POST /api/gpa/courses — add a new course
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, year, courseType, creditHours, grade } = await req.json();

  if (!name || !year || !courseType || !creditHours || !grade) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  const gradePoints = GRADE_MAP[grade];
  if (gradePoints === undefined) {
    return NextResponse.json({ error: "Invalid grade" }, { status: 400 });
  }

  const course = await db.gpaCourse.create({
    data: {
      userId: session.user.id,
      name,
      year,
      courseType,
      creditHours: Number(creditHours),
      grade,
      gradePoints,
    },
  });

  return NextResponse.json(course, { status: 201 });
}
