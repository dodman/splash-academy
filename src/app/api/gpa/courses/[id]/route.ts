import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GRADE_MAP } from "@/lib/gpa";

// PUT /api/gpa/courses/[id] — update a course
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const course = await db.gpaCourse.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { name, year, courseType, creditHours, grade } = await req.json();

  const gradePoints = grade ? GRADE_MAP[grade] : undefined;
  if (grade && gradePoints === undefined) {
    return NextResponse.json({ error: "Invalid grade" }, { status: 400 });
  }

  const updated = await db.gpaCourse.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(year && { year }),
      ...(courseType && { courseType }),
      ...(creditHours && { creditHours: Number(creditHours) }),
      ...(grade && { grade, gradePoints }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/gpa/courses/[id] — delete a course
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const course = await db.gpaCourse.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.gpaCourse.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
