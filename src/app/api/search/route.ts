import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ courses: [], categories: [], lessons: [] });
  }

  const searchTerm = `%${q}%`;

  const [courses, categories, lessons] = await Promise.all([
    db.course.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        instructor: { select: { name: true } },
        category: { select: { name: true } },
      },
      take: 10,
    }),
    db.category.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
    }),
    db.lesson.findMany({
      where: {
        title: { contains: q, mode: "insensitive" },
        section: {
          course: { status: "PUBLISHED" },
        },
      },
      include: {
        section: {
          include: {
            course: { select: { title: true, slug: true } },
          },
        },
      },
      take: 10,
    }),
  ]);

  // Remove unused variable warning
  void searchTerm;

  return NextResponse.json({ courses, categories, lessons });
}
