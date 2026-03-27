import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import slugify from "slugify";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courses = await db.course.findMany({
    where: { instructorId: session.user.id },
    include: {
      category: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(courses);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, price, categoryId } = await req.json();

  if (!title || !description || price === undefined || !categoryId) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  // Generate unique slug
  let slug = slugify(title, { lower: true, strict: true });
  const existing = await db.course.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  const course = await db.course.create({
    data: {
      title,
      slug,
      description,
      price: parseFloat(price),
      categoryId,
      instructorId: session.user.id,
      status: "DRAFT",
    },
  });

  return NextResponse.json(course, { status: 201 });
}
