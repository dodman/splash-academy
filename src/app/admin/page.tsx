import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/");

  const [userCount, courseCount, pendingCount, enrollmentCount] =
    await Promise.all([
      db.user.count(),
      db.course.count(),
      db.course.count({ where: { status: "SUBMITTED" } }),
      db.enrollment.count(),
    ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground mt-1">
        Manage users, courses, and content
      </p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold mt-1">{userCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Courses</p>
          <p className="text-2xl font-bold mt-1">{courseCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pending Review</p>
          <p className="text-2xl font-bold mt-1 text-warning">{pendingCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Enrollments</p>
          <p className="text-2xl font-bold mt-1">{enrollmentCount}</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/courses"
          className="border border-border rounded-lg p-6 hover:shadow-lg transition group"
        >
          <h3 className="font-semibold text-lg group-hover:text-primary transition">
            Manage Courses
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Review, approve, reject, or remove courses
          </p>
          {pendingCount > 0 && (
            <span className="inline-block mt-3 text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
              {pendingCount} awaiting review
            </span>
          )}
        </Link>
        <Link
          href="/admin/users"
          className="border border-border rounded-lg p-6 hover:shadow-lg transition group"
        >
          <h3 className="font-semibold text-lg group-hover:text-primary transition">
            Manage Users
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            View all users and manage roles
          </p>
        </Link>
      </div>
    </div>
  );
}
