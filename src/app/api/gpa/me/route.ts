/**
 * GET /api/gpa/me
 * Mirrors RicoGPA's GET /api/gpa/me — dashboard summary.
 *
 * Response:
 *   {
 *     gpa,                                     // cumulative
 *     totalCredits,
 *     totalCourses,
 *     byYear: {
 *       "Year 1": { courses: [...], gpa, totalCredits },
 *       ...
 *     }
 *   }
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calcGPA } from "@/lib/gpa";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = await db.gpaCourse.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const { gpa, totalCredits } = calcGPA(courses);

  // Group by year, computing per-year GPA + credits like RicoGPA's YearCard
  const byYear: Record<
    string,
    { courses: typeof courses; gpa: number; totalCredits: number }
  > = {};
  for (const c of courses) {
    if (!byYear[c.year]) {
      byYear[c.year] = { courses: [], gpa: 0, totalCredits: 0 };
    }
    byYear[c.year].courses.push(c);
  }
  for (const year of Object.keys(byYear)) {
    const yearStats = calcGPA(byYear[year].courses);
    byYear[year].gpa = yearStats.gpa;
    byYear[year].totalCredits = yearStats.totalCredits;
  }

  return NextResponse.json({
    gpa,
    totalCredits,
    totalCourses: courses.length,
    byYear,
  });
}
