import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = await db.course.findMany({
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      category: { select: { name: true } },
      _count: { select: { enrollments: true, sections: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(courses);
}
