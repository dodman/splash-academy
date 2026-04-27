import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const course = await db.course.findUnique({
    where: { slug },
    select: { id: true, instructorId: true },
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
      return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
    }
  }

  // Students see only their own quizzes; instructors/admins see all
  const whereClause =
    isInstructor || isAdminRole
      ? { courseId: course.id }
      : { courseId: course.id, generatedBy: session.user.id };

  const quizzes = await db.generatedQuiz.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      topic: true,
      difficulty: true,
      questionType: true,
      questions: true,
      createdAt: true,
      user: { select: { name: true } },
    },
    take: 20,
  });

  return NextResponse.json(quizzes);
}
