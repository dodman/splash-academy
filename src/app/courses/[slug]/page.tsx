import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import EnrollButton from "./EnrollButton";
import CourseActions from "./CourseActions";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      instructor: { select: { id: true, name: true, bio: true } },
      category: true,
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course || course.status !== "PUBLISHED") {
    notFound();
  }

  const session = await auth();
  let isEnrolled = false;
  let lastLessonId: string | null = null;

  if (session?.user?.id) {
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: course.id,
        },
      },
    });
    isEnrolled = !!enrollment;

    if (isEnrolled) {
      // Find the last lesson the student viewed
      const lastProgress = await db.progress.findFirst({
        where: {
          userId: session.user.id,
          lesson: { section: { courseId: course.id } },
        },
        orderBy: { completedAt: "desc" },
        select: { lessonId: true },
      });
      lastLessonId = lastProgress?.lessonId || null;
    }
  }

  const totalLessons = course.sections.reduce(
    (sum, s) => sum + s.lessons.length,
    0
  );
  const totalDuration = course.sections.reduce(
    (sum, s) =>
      sum + s.lessons.reduce((lSum, l) => lSum + l.duration, 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Button */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Courses
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Course Info */}
        <div className="lg:col-span-2 animate-fade-in">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {course.category.name}
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold leading-tight">{course.title}</h1>
          <p className="mt-3 text-muted-foreground text-lg">
            By {course.instructor.name}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
              {course._count.enrollments} {course._count.enrollments === 1 ? "student" : "students"}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              {totalLessons} lessons
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {Math.ceil(totalDuration / 60)} min
            </span>
          </div>

          <CourseActions courseId={course.id} isLoggedIn={!!session?.user?.id} />

          <div className="mt-6">
            <h2 className="text-lg font-semibold">About this course</h2>
            <p className="mt-2 text-muted-foreground whitespace-pre-line">
              {course.description}
            </p>
          </div>

          {/* Curriculum */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold">Curriculum</h2>
            <div className="mt-4 space-y-4">
              {course.sections.map((section) => (
                <div
                  key={section.id}
                  className="border border-border rounded-lg"
                >
                  <div className="px-4 py-3 bg-muted font-medium">
                    {section.title}
                  </div>
                  <div className="divide-y divide-border">
                    {section.lessons.map((lesson) => {
                      const lessonContent = (
                        <>
                          <span className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-muted-foreground flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {lesson.title}
                          </span>
                          <span className="text-muted-foreground flex-shrink-0">
                            {lesson.isFree && (
                              <span className="text-success mr-2">Free</span>
                            )}
                            {Math.ceil(lesson.duration / 60)} min
                          </span>
                        </>
                      );

                      return isEnrolled ? (
                        <Link
                          key={lesson.id}
                          href={`/courses/${course.slug}/learn/${lesson.id}`}
                          className="px-4 py-3 flex justify-between items-center text-sm hover:bg-primary/5 transition cursor-pointer group"
                        >
                          {lessonContent}
                        </Link>
                      ) : (
                        <div
                          key={lesson.id}
                          className="px-4 py-3 flex justify-between items-center text-sm"
                        >
                          {lessonContent}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {course.sections.length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No lessons added yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Enrollment Card */}
        <div className="lg:col-span-1 animate-fade-in-delay-1">
          <div className="border border-border rounded-2xl p-6 sticky top-24 shadow-sm">
            <div className="h-44 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center mb-5 overflow-hidden">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-primary/30 text-5xl font-bold">
                  {course.title[0]}
                </span>
              )}
            </div>

            <p className="text-3xl font-bold">
              {course.price === 0 ? "Free" : `$${course.price.toFixed(2)}`}
            </p>

            {isEnrolled ? (
              <>
                <Link
                  href={`/courses/${course.slug}/learn/${lastLessonId || course.sections[0]?.lessons[0]?.id || ""}`}
                  className="mt-4 block w-full bg-success text-white py-3.5 rounded-xl font-semibold text-center hover:opacity-90 hover:shadow-lg transition-all duration-200"
                >
                  Continue Learning
                </Link>
                <Link
                  href={`/courses/${course.slug}/learn/ai-study`}
                  className="mt-2 block w-full border border-amber-300 bg-amber-50 text-amber-800 py-2.5 rounded-xl font-medium text-sm text-center hover:bg-amber-100 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span>✨</span> AI Study &mdash; Materials &amp; Quizzes
                </Link>
              </>
            ) : (
              <EnrollButton courseId={course.id} price={course.price} />
            )}

            <div className="mt-6 space-y-3 text-sm pt-6 border-t border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lessons</span>
                <span className="font-medium">{totalLessons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">
                  {Math.ceil(totalDuration / 60)} min
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Students</span>
                <span className="font-medium">
                  {course._count.enrollments}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
