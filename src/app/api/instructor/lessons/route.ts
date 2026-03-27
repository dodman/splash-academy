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
