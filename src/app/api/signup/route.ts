import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const userRole = role === "INSTRUCTOR" ? "INSTRUCTOR" : "STUDENT";
    const approved = userRole === "STUDENT";

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Generate verification token (expires in 24 hours)
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: userRole,
        approved,
        emailVerified: false,
        verificationToken,
        verificationExpires,
      },
    });

    // Send verification email
    const { sent, verifyUrl } = await sendVerificationEmail(email, verificationToken);

    if (!approved) {
      return NextResponse.json(
        {
          message: "Account created! Please verify your email, then wait for admin approval.",
          userId: user.id,
          pendingApproval: true,
          emailSent: sent,
          // Include verifyUrl when SMTP is not configured (dev mode)
          ...(!sent && { verifyUrl }),
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        message: "Account created! Please check your email to verify your account.",
        userId: user.id,
        needsVerification: true,
        emailSent: sent,
        ...(!sent && { verifyUrl }),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
