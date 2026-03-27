import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function StudentDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const enrollments = await db.enrollment.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        include: {
          instructor: { select: { name: true } },
          category: { select: { name: true } },
          sections: {
            include: {
              lessons: { select: { id: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get progress for each enrollment
  const enrollmentsWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const totalLessons = enrollment.course.sections.reduce(
        (sum, s) => sum + s.lessons.length,
        0
      );
      const completedLessons = await db.progress.count({
        where: {
          userId: session.user.id,
          completed: true,
          lesson: {
            section: { courseId: enrollment.courseId },
          },
        },
      });
      return {
        ...enrollment,
        totalLessons,
        completedLessons,
        progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      };
    })
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold">My Learning</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Welcome back, {session.user.name}!
        </p>
      </div>

      {enrollmentsWithProgress.length === 0 ? (
        <div className="mt-16 text-center animate-fade-in">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-muted-foreground mt-4 text-lg">
            You haven&apos;t enrolled in any courses yet.
          </p>
          <Link
            href="/courses"
            className="inline-block mt-6 bg-primary text-white px-8 py-3 rounded-xl font-semibold hover:bg-primary-dark hover:shadow-lg transition-all duration-200"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollmentsWithProgress.map((enrollment) => {
            const firstLesson = enrollment.course.sections[0]?.lessons[0];
            return (
              <Link
                key={enrollment.id}
                href={
                  firstLesson
                    ? `/courses/${enrollment.course.slug}/learn/${firstLesson.id}`
                    : `/courses/${enrollment.course.slug}`
                }
                className="border border-border rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group bg-white"
              >
                <div className="h-36 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-primary/30 text-4xl font-bold">
                    {enrollment.course.title[0]}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition line-clamp-2 leading-snug">
                    {enrollment.course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {enrollment.course.instructor.name}
                  </p>
                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span className="font-medium">{enrollment.progress}% complete</span>
                      <span>
                        {enrollment.completedLessons}/{enrollment.totalLessons} lessons
                      </span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          enrollment.progress === 100 ? "bg-success" : "bg-primary"
                        }`}
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
