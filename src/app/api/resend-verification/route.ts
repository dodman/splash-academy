import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json(
        { message: "If that email exists, a verification link has been sent." },
        { status: 200 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified. You can log in." },
        { status: 200 }
      );
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationExpires },
    });

    const { sent, verifyUrl } = await sendVerificationEmail(email, verificationToken);

    return NextResponse.json(
      {
        message: "Verification email sent. Please check your inbox.",
        emailSent: sent,
        ...(!sent && { verifyUrl }),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
