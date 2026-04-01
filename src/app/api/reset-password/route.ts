import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { resetToken: token } });

  if (!user || !user.resetExpires || user.resetExpires < new Date()) {
    return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetExpires: null,
    },
  });

  return NextResponse.json({ message: "Password has been reset successfully" });
}
