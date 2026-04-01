import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/roles";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [pendingCourses, pendingUsers, openReports, roleApplications] = await Promise.all([
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
    db.report.count({ where: { status: "OPEN" } }),
    db.user.findMany({
      where: { appliedRole: { not: null } },
      select: {
        id: true,
        name: true,
        email: true,
        appliedRole: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    pendingCount: pendingCourses.length + pendingUsers.length + openReports + roleApplications.length,
    pendingCourses,
    pendingUsers,
    openReports,
    roleApplications,
  });
}
