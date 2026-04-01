import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ message: "If an account with that email exists, a reset link has been generated." });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.user.update({
    where: { id: user.id },
    data: { resetToken, resetExpires },
  });

  // Log reset link to console (since email is not configured)
  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
  console.log(`\n🔑 Password reset link for ${email}:\n${resetUrl}\n`);

  return NextResponse.json({
    message: "If an account with that email exists, a reset link has been generated.",
    // Include token in dev mode for easy testing
    ...(process.env.NODE_ENV !== "production" && { resetToken }),
  });
}
