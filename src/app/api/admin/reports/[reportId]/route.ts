import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// PUT — update report status/note
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reportId } = await params;
  const { status, adminNote } = await req.json();

  if (status && !["OPEN", "REVIEWED", "RESOLVED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (adminNote !== undefined) updateData.adminNote = adminNote;

  const report = await db.report.update({
    where: { id: reportId },
    data: updateData,
  });

  return NextResponse.json(report);
}
