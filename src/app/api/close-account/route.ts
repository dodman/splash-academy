import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// DELETE — close own account
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Don't let admins delete themselves this way
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user?.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admin accounts cannot be closed this way. Contact another admin." },
        { status: 400 }
      );
    }

    // Delete all related records then the user in a transaction
    await db.$transaction([
      db.progress.deleteMany({ where: { userId } }),
      db.enrollment.deleteMany({ where: { userId } }),
      db.favorite.deleteMany({ where: { userId } }),
      db.wishlist.deleteMany({ where: { userId } }),
      db.report.deleteMany({ where: { userId } }),
      db.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ message: "Account closed successfully" });
  } catch {
    return NextResponse.json(
      { error: "Failed to close account. Please try again." },
      { status: 500 }
    );
  }
}
