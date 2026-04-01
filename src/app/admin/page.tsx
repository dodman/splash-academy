import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/roles";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user?.id || !isAdmin(session.user.role)) redirect("/");

  const [userCount, courseCount, pendingCourses, enrollmentCount, pendingUsers, openReports, roleApplications] =
    await Promise.all([
      db.user.count(),
      db.course.count(),
      db.course.count({ where: { status: "SUBMITTED" } }),
      db.enrollment.count(),
      db.user.count({ where: { approved: false } }),
      db.report.count({ where: { status: "OPEN" } }),
      db.user.count({ where: { appliedRole: { not: null } } }),
    ]);

  const totalNotifications = pendingCourses + pendingUsers + openReports + roleApplications;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground mt-1">Manage users, courses, and content</p>

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
                  <li><Link href="/admin/users" className="underline">{pendingUsers} user{pendingUsers !== 1 ? "s" : ""} awaiting approval</Link></li>
                )}
                {roleApplications > 0 && (
                  <li><Link href="/admin/users" className="underline">{roleApplications} role application{roleApplications !== 1 ? "s" : ""} to review</Link></li>
                )}
                {pendingCourses > 0 && (
                  <li><Link href="/admin/courses" className="underline">{pendingCourses} course{pendingCourses !== 1 ? "s" : ""} awaiting review</Link></li>
                )}
                {openReports > 0 && (
                  <li><Link href="/admin/reports" className="underline">{openReports} open report{openReports !== 1 ? "s" : ""}</Link></li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Users", value: userCount },
          { label: "Total Courses", value: courseCount },
          { label: "Pending Courses", value: pendingCourses, warn: pendingCourses > 0 },
          { label: "Pending Users", value: pendingUsers, warn: pendingUsers > 0 },
          { label: "Open Reports", value: openReports, warn: openReports > 0 },
          { label: "Enrollments", value: enrollmentCount },
        ].map((stat) => (
          <div key={stat.label} className="border border-border rounded-lg p-4 relative">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.warn ? "text-warning" : ""}`}>{stat.value}</p>
            {stat.warn && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/courses" className="border border-border rounded-lg p-6 hover:shadow-lg transition group">
          <h3 className="font-semibold text-lg group-hover:text-primary transition">Manage Courses</h3>
          <p className="text-muted-foreground text-sm mt-1">Review, approve, reject, or remove courses</p>
        </Link>
        <Link href="/admin/users" className="border border-border rounded-lg p-6 hover:shadow-lg transition group">
          <h3 className="font-semibold text-lg group-hover:text-primary transition">Manage Users</h3>
          <p className="text-muted-foreground text-sm mt-1">Approve users, manage roles, delete accounts</p>
        </Link>
        <Link href="/admin/reports" className="border border-border rounded-lg p-6 hover:shadow-lg transition group">
          <h3 className="font-semibold text-lg group-hover:text-primary transition">User Reports</h3>
          <p className="text-muted-foreground text-sm mt-1">View and respond to user-submitted reports</p>
          {openReports > 0 && (
            <span className="inline-block mt-3 text-xs bg-danger/10 text-danger px-2 py-0.5 rounded-full">
              {openReports} open
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
