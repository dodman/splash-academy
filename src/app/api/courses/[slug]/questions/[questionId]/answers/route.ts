import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; questionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { questionId } = await params;

  const question = await db.question.findUnique({ where: { id: questionId } });
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const body = await req.json();
  if (!body.body?.trim()) {
    return NextResponse.json({ error: "Answer body is required" }, { status: 400 });
  }

  const answer = await db.answer.create({
    data: {
      body: body.body.trim(),
      userId: session.user.id,
      questionId,
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  return NextResponse.json(answer);
}
