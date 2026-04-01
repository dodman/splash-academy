import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sectionId, title, videoUrl, duration, isFree } = await req.json();

  // Verify ownership through section -> course
  const section = await db.section.findUnique({
    where: { id: sectionId },
    include: { course: true },
  });

  if (!section || section.course.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get next order
  const lastLesson = await db.lesson.findFirst({
    where: { sectionId },
    orderBy: { order: "desc" },
  });

  const lesson = await db.lesson.create({
    data: {
      title,
      videoUrl: videoUrl || "",
      duration: duration || 0,
      isFree: isFree || false,
      sectionId,
      order: (lastLesson?.order ?? -1) + 1,
    },
  });

  return NextResponse.json(lesson, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId, title, videoUrl, duration, isFree } = await req.json();

  if (!lessonId) {
    return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
  }

  // Verify ownership through lesson -> section -> course
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { include: { course: true } } },
  });

  if (!lesson || lesson.section.course.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title.trim();
  if (videoUrl !== undefined) data.videoUrl = videoUrl.trim();
  if (duration !== undefined) data.duration = parseInt(duration) || 0;
  if (isFree !== undefined) data.isFree = Boolean(isFree);

  const updated = await db.lesson.update({
    where: { id: lessonId },
    data,
  });

  return NextResponse.json(updated);
}
