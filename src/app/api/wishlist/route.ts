import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — list user's wishlist courses
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wishlist = await db.wishlist.findMany({
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

  return NextResponse.json(wishlist);
}

// POST — add/remove a course to/from wishlist (toggle)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await req.json();
  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  const existing = await db.wishlist.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });

  if (existing) {
    await db.wishlist.delete({ where: { id: existing.id } });
    return NextResponse.json({ wishlisted: false });
  }

  await db.wishlist.create({
    data: { userId: session.user.id, courseId },
  });

  return NextResponse.json({ wishlisted: true });
}
