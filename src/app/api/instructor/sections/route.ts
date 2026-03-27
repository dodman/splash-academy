import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId, title } = await req.json();

  // Verify ownership
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course || course.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get next order
  const lastSection = await db.section.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
  });

  const section = await db.section.create({
    data: {
      title,
      courseId,
      order: (lastSection?.order ?? -1) + 1,
    },
  });

  return NextResponse.json(section, { status: 201 });
}
