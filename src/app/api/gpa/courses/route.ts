/**
 * GET /api/gpa/courses
 * Mirrors RicoGPA's GET /api/gpa/courses — flat list of the user's courses,
 * ordered by year then creation desc.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = await db.gpaCourse.findMany({
    where: { userId: session.user.id },
    orderBy: [{ year: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(courses);
}
