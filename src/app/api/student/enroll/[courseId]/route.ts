import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  // Check course exists and is published
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Check not already enrolled
  const existing = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Already enrolled" }, { status: 400 });
  }

  // For MVP: enroll directly (skip payment for now)
  const enrollment = await db.enrollment.create({
    data: { userId: session.user.id, courseId },
  });

  return NextResponse.json(enrollment, { status: 201 });
}
