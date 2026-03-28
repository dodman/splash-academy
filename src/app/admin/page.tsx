import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") redirect("/");

  const [userCount, courseCount, pendingCourses, enrollmentCount, pendingUsers] =
    await Promise.all([
      db.user.count(),
      db.course.count(),
      db.course.count({ where: { status: "SUBMITTED" } }),
      db.enrollment.count(),
      db.user.count({ where: { approved: false } }),
    ]);

  const totalNotifications = pendingCourses + pendingUsers;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground mt-1">
        Manage users, courses, and content
      </p>

      {/* Notification Banner */}
      {totalNotifications > 0 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800">Action Required</h3>
              <ul className="mt-1 space-y-1 text-sm text-yellow-700">
                {pendingUsers > 0 && (
                  <li>
                    <Link href="/admin/users" className="underline hover:text-yellow-900">
                      {pendingUsers} user{pendingUsers !== 1 ? "s" : ""} awaiting approval
                    </Link>
                  </li>
                )}
                {pendingCourses > 0 && (
                  <li>
                    <Link href="/admin/courses" className="underline hover:text-yellow-900">
                      {pendingCourses} course{pendingCourses !== 1 ? "s" : ""} awaiting review
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold mt-1">{userCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Courses</p>
          <p className="text-2xl font-bold mt-1">{courseCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 relative">
          <p className="text-sm text-muted-foreground">Pending Courses</p>
          <p className="text-2xl font-bold mt-1 text-warning">{pendingCourses}</p>
          {pendingCourses > 0 && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
        <div className="border border-border rounded-lg p-4 relative">
          <p className="text-sm text-muted-foreground">Pending Users</p>
          <p className="text-2xl font-bold mt-1 text-warning">{pendingUsers}</p>
          {pendingUsers > 0 && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
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
          {pendingCourses > 0 && (
            <span className="inline-block mt-3 text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
              {pendingCourses} awaiting review
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
            Approve instructors, manage roles, view all users
          </p>
          {pendingUsers > 0 && (
            <span className="inline-block mt-3 text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
              {pendingUsers} awaiting approval
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
