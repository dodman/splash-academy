import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [pendingCourses, pendingUsers] = await Promise.all([
    db.course.findMany({
      where: { status: "SUBMITTED" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        instructor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      where: { approved: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    pendingCount: pendingCourses.length + pendingUsers.length,
    pendingCourses,
    pendingUsers,
  });
}
