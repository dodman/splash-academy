import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE — close own account
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Don't let admins delete themselves this way
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (user?.role === "ADMIN") {
    return NextResponse.json(
      { error: "Admin accounts cannot be closed this way. Contact another admin." },
      { status: 400 }
    );
  }

  await db.user.delete({ where: { id: session.user.id } });

  return NextResponse.json({ message: "Account closed successfully" });
}
