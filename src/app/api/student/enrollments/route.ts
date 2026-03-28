import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollments = await db.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          instructor: { select: { name: true } },
          category: { select: { name: true } },
          sections: {
            include: {
              lessons: { select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate progress for each enrollment
  const enriched = await Promise.all(
    enrollments.map(async (enrollment) => {
      const totalLessons = enrollment.course.sections.reduce(
        (sum, s) => sum + s.lessons.length,
        0
      );
      const completedLessons = await db.progress.count({
        where: {
          userId: session.user.id,
          completed: true,
          lesson: {
            section: { courseId: enrollment.courseId },
          },
        },
      });
      return {
        ...enrollment,
        totalLessons,
        completedLessons,
        progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      };
    })
  );

  return NextResponse.json(enriched);
}
