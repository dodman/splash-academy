import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST — submit a report
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, message } = await req.json();

  if (!subject?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Subject and message are required" },
      { status: 400 }
    );
  }

  if (subject.length > 200 || message.length > 5000) {
    return NextResponse.json(
      { error: "Subject or message is too long" },
      { status: 400 }
    );
  }

  const report = await db.report.create({
    data: {
      userId: session.user.id,
      subject: subject.trim().slice(0, 200),
      message: message.trim().slice(0, 5000),
    },
  });

  return NextResponse.json({ message: "Report submitted successfully", report }, { status: 201 });
}
