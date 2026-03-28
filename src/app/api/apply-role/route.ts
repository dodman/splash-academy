import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST — apply to become instructor or admin
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await req.json();

  if (!role || !["INSTRUCTOR", "ADMIN"].includes(role)) {
    return NextResponse.json(
      { error: "Invalid role. Must be INSTRUCTOR or ADMIN" },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role === role) {
    return NextResponse.json(
      { error: `You are already ${role === "INSTRUCTOR" ? "an" : "an"} ${role.toLowerCase()}` },
      { status: 400 }
    );
  }

  if (user.appliedRole) {
    return NextResponse.json(
      { error: `You already have a pending application for ${user.appliedRole.toLowerCase()}` },
      { status: 400 }
    );
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { appliedRole: role },
  });

  return NextResponse.json({
    message: `Application to become ${role.toLowerCase()} submitted. An admin will review your request.`,
  });
}
