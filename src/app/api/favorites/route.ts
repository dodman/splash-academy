import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — list user's favorite courses
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await db.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          instructor: { select: { name: true } },
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favorites);
}

// POST — add a course to favorites
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await req.json();
  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  const existing = await db.favorite.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });

  if (existing) {
    // Toggle off — remove favorite
    await db.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await db.favorite.create({
    data: { userId: session.user.id, courseId },
  });

  return NextResponse.json({ favorited: true });
}
