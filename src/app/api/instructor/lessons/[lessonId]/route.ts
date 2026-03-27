import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;
  const body = await req.json();

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { include: { course: true } } },
  });

  if (!lesson || lesson.section.course.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.lesson.update({
    where: { id: lessonId },
    data: {
      title: body.title,
      videoUrl: body.videoUrl,
      duration: body.duration,
      isFree: body.isFree,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId } = await params;

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { include: { course: true } } },
  });

  if (!lesson || lesson.section.course.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete related progress records first
  await db.progress.deleteMany({ where: { lessonId } });
  await db.lesson.delete({ where: { id: lessonId } });

  return NextResponse.json({ success: true });
}
