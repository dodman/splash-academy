import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sectionId } = await params;
  const { title } = await req.json();

  const section = await db.section.findUnique({
    where: { id: sectionId },
    include: { course: true },
  });

  if (!section || section.course.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.section.update({
    where: { id: sectionId },
    data: { title },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sectionId } = await params;

  const section = await db.section.findUnique({
    where: { id: sectionId },
    include: { course: true },
  });

  if (!section || section.course.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.section.delete({ where: { id: sectionId } });

  return NextResponse.json({ success: true });
}
