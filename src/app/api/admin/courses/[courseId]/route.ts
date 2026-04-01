import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/roles";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;
  const body = await req.json();
  const { action, rejectionNote, price } = body;

  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Handle price update
  if (action === "updatePrice") {
    if (typeof price !== "number" || price < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    const updated = await db.course.update({
      where: { id: courseId },
      data: { price },
    });
    return NextResponse.json(updated);
  }

  let newStatus: string;

  switch (action) {
    case "approve":
      newStatus = "APPROVED";
      break;
    case "publish":
      newStatus = "PUBLISHED";
      break;
    case "unpublish":
      newStatus = "DRAFT";
      break;
    case "reject":
      newStatus = "REJECTED";
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const updated = await db.course.update({
    where: { id: courseId },
    data: {
      status: newStatus,
      rejectionNote: action === "reject" ? rejectionNote || "No reason provided" : null,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  // Delete enrollments and sections/lessons first (cascade should handle sections/lessons)
  await db.enrollment.deleteMany({ where: { courseId } });
  await db.course.delete({ where: { id: courseId } });

  return NextResponse.json({ success: true });
}
