import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT /api/admin/users/[userId] — approve/reject user or change role
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

  // Don't let admin modify themselves
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  // Handle approval
  if (typeof body.approved === "boolean") {
    updateData.approved = body.approved;
  }

  // Handle role change
  if (body.role && ["STUDENT", "INSTRUCTOR", "ADMIN"].includes(body.role)) {
    updateData.role = body.role;
    // Auto-approve students
    if (body.role === "STUDENT") {
      updateData.approved = true;
    }
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: updateData,
  });

  return NextResponse.json({
    message: `User ${updated.approved ? "approved" : "updated"} successfully`,
    user: { id: updated.id, name: updated.name, role: updated.role, approved: updated.approved },
  });
}

// DELETE /api/admin/users/[userId] — delete user
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await db.user.delete({ where: { id: userId } });

  return NextResponse.json({ message: "User deleted" });
}
