import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// PUT /api/admin/users/[userId] — approve, change role, handle applications
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;
  const body = await req.json();

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (typeof body.approved === "boolean") {
    updateData.approved = body.approved;
  }

  if (body.role && ["STUDENT", "INSTRUCTOR", "ADMIN"].includes(body.role)) {
    updateData.role = body.role;
    if (body.role === "STUDENT") {
      updateData.approved = true;
    }
    // Clear any pending role application when role is changed
    updateData.appliedRole = null;
  }

  // Clear role application
  if (body.clearApplication) {
    updateData.appliedRole = null;
  }

  // Reset password to default (123456)
  if (body.resetPassword) {
    updateData.passwordHash = await bcrypt.hash("123456", 10);
    updateData.resetToken = null;
    updateData.resetExpires = null;
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: updateData,
  });

  return NextResponse.json({
    message: "User updated successfully",
    user: { id: updated.id, name: updated.name, role: updated.role, approved: updated.approved },
  });
}

// DELETE /api/admin/users/[userId] — delete user and all related data
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Get user's courses and their lessons for cleanup
    const userCourses = await db.course.findMany({
      where: { instructorId: userId },
      include: { sections: { include: { lessons: { select: { id: true } } } } },
    });
    const courseIds = userCourses.map((c) => c.id);
    const lessonIds = userCourses.flatMap((c) =>
      c.sections.flatMap((s) => s.lessons.map((l) => l.id))
    );

    // Delete all related records then the user in a transaction
    await db.$transaction([
      // Delete progress for this user
      db.progress.deleteMany({ where: { userId } }),
      // Delete enrollments for this user
      db.enrollment.deleteMany({ where: { userId } }),
      // Delete favorites & wishlist for this user
      db.favorite.deleteMany({ where: { userId } }),
      db.wishlist.deleteMany({ where: { userId } }),
      // Delete reports by this user
      db.report.deleteMany({ where: { userId } }),
      // If user is an instructor, clean up their courses' related data
      ...(courseIds.length > 0
        ? [
            db.favorite.deleteMany({ where: { courseId: { in: courseIds } } }),
            db.wishlist.deleteMany({ where: { courseId: { in: courseIds } } }),
            db.enrollment.deleteMany({ where: { courseId: { in: courseIds } } }),
            ...(lessonIds.length > 0
              ? [db.progress.deleteMany({ where: { lessonId: { in: lessonIds } } })]
              : []),
            db.lesson.deleteMany({ where: { sectionId: { in: userCourses.flatMap((c) => c.sections.map((s) => s.id)) } } }),
            db.section.deleteMany({ where: { courseId: { in: courseIds } } }),
            db.course.deleteMany({ where: { instructorId: userId } }),
          ]
        : []),
      // Finally delete the user
      db.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ message: "User deleted" });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete user. Please try again." },
      { status: 500 }
    );
  }
}
