import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const course = await db.course.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const questions = await db.question.findMany({
    where: { courseId: course.id },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      answers: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(questions);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const course = await db.course.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const body = await req.json();
  const { title, body: questionBody, lessonId } = body;

  if (!title?.trim() || !questionBody?.trim()) {
    return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
  }

  const question = await db.question.create({
    data: {
      title: title.trim(),
      body: questionBody.trim(),
      userId: session.user.id,
      courseId: course.id,
      lessonId: lessonId || null,
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      answers: true,
    },
  });

  return NextResponse.json(question);
}
