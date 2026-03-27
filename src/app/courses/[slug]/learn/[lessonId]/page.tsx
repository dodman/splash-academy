import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import LessonPlayer from "./LessonPlayer";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const course = await db.course.findUnique({
    where: { slug },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!course) notFound();

  // Check enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId: course.id },
    },
  });

  if (!enrollment) redirect(`/courses/${slug}`);

  // Get current lesson
  const allLessons = course.sections.flatMap((s) =>
    s.lessons.map((l) => ({ ...l, sectionTitle: s.title }))
  );
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const currentLesson = allLessons[currentIndex];

  if (!currentLesson) notFound();

  // Get progress for all lessons
  const progress = await db.progress.findMany({
    where: {
      userId: session.user.id,
      lessonId: { in: allLessons.map((l) => l.id) },
      completed: true,
    },
  });
  const completedIds = new Set(progress.map((p) => p.lessonId));

  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <LessonPlayer
      course={{ id: course.id, title: course.title, slug: course.slug }}
      sections={course.sections}
      currentLesson={currentLesson}
      prevLessonId={prevLesson?.id || null}
      nextLessonId={nextLesson?.id || null}
      completedLessonIds={Array.from(completedIds)}
      totalLessons={allLessons.length}
    />
  );
}
