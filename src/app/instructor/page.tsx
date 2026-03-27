import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function InstructorDashboard() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "INSTRUCTOR") {
    redirect("/");
  }

  const courses = await db.course.findMany({
    where: { instructorId: session.user.id },
    include: {
      category: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalStudents = courses.reduce((sum, c) => sum + c._count.enrollments, 0);

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SUBMITTED: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    PUBLISHED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome, {session.user.name}
          </p>
        </div>
        <Link
          href="/instructor/courses/new"
          className="bg-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition text-sm"
        >
          + Create Course
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Courses</p>
          <p className="text-2xl font-bold mt-1">{courses.length}</p>
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Students</p>
          <p className="text-2xl font-bold mt-1">{totalStudents}</p>
        </div>
        <div className="border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Published</p>
          <p className="text-2xl font-bold mt-1">
            {courses.filter((c) => c.status === "PUBLISHED").length}
          </p>
        </div>
      </div>

      {/* Course List */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Your Courses</h2>
        {courses.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg">
            <p className="text-muted-foreground">
              You haven&apos;t created any courses yet.
            </p>
            <Link
              href="/instructor/courses/new"
              className="inline-block mt-4 text-primary hover:underline"
            >
              Create your first course
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{course.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${statusColors[course.status] || ""}`}
                    >
                      {course.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {course.category.name} &middot;{" "}
                    {course._count.enrollments} {course._count.enrollments === 1 ? "student" : "students"} &middot; $
                    {course.price.toFixed(2)}
                  </p>
                  {course.rejectionNote && (
                    <p className="text-sm text-danger mt-1">
                      Rejection note: {course.rejectionNote}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/instructor/courses/${course.id}/edit`}
                    className="text-sm px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/instructor/courses/${course.id}/content`}
                    className="text-sm px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition"
                  >
                    Content
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
