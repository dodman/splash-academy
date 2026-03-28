import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Only allow STUDENT or INSTRUCTOR signup (ADMIN created manually)
    const userRole = role === "INSTRUCTOR" ? "INSTRUCTOR" : "STUDENT";

    // Instructors need admin approval; students are auto-approved
    const approved = userRole === "STUDENT";

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { name, email, passwordHash, role: userRole, approved },
    });

    if (!approved) {
      return NextResponse.json(
        {
          message: "Account created! Your instructor account is pending admin approval. You will be able to log in once approved.",
          userId: user.id,
          pendingApproval: true,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
