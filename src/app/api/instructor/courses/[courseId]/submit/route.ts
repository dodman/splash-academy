import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { sections: { include: { lessons: true } } },
  });

  if (!course || course.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (course.status !== "DRAFT" && course.status !== "REJECTED") {
    return NextResponse.json(
      { error: "Course can only be submitted from DRAFT or REJECTED status" },
      { status: 400 }
    );
  }

  // Must have at least one lesson
  const totalLessons = course.sections.reduce(
    (sum, s) => sum + s.lessons.length,
    0
  );
  if (totalLessons === 0) {
    return NextResponse.json(
      { error: "Course must have at least one lesson" },
      { status: 400 }
    );
  }

  const updated = await db.course.update({
    where: { id: courseId },
    data: { status: "SUBMITTED", rejectionNote: null },
  });

  return NextResponse.json(updated);
}
