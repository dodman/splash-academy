"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Props {
  course: { id: string; title: string; slug: string };
  sections: Section[];
  currentLesson: Lesson & { sectionTitle: string };
  prevLessonId: string | null;
  nextLessonId: string | null;
  completedLessonIds: string[];
  totalLessons: number;
}

export default function LessonPlayer({
  course,
  sections,
  currentLesson,
  prevLessonId,
  nextLessonId,
  completedLessonIds,
  totalLessons,
}: Props) {
  const router = useRouter();
  const [completed, setCompleted] = useState(
    completedLessonIds.includes(currentLesson.id)
  );
  const [completedSet, setCompletedSet] = useState(
    new Set(completedLessonIds)
  );

  const markComplete = async () => {
    await fetch(`/api/student/progress/${currentLesson.id}`, {
      method: "POST",
    });
    setCompleted(true);
    setCompletedSet((prev) => new Set([...prev, currentLesson.id]));
  };

  const progress = Math.round((completedSet.size / totalLessons) * 100);

  // Check if URL is a direct video file
  const isDirectVideo = (url: string) => {
    return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || url.includes("cloudinary.com");
  };

  // Convert YouTube/Vimeo URL to embed
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    const ytMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/
    );
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* Video + Controls */}
      <div className="flex-1 flex flex-col">
        {/* Video */}
        <div className="bg-black aspect-video w-full">
          {currentLesson.videoUrl ? (
            isDirectVideo(currentLesson.videoUrl) ? (
              <video
                src={currentLesson.videoUrl}
                controls
                className="w-full h-full"
                controlsList="nodownload"
              />
            ) : (
              <iframe
                src={getEmbedUrl(currentLesson.videoUrl)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50">
              No video uploaded for this lesson
            </div>
          )}
        </div>

        {/* Lesson info & controls */}
        <div className="p-4 sm:p-6 border-b border-border">
          <p className="text-sm text-muted-foreground">
            {currentLesson.sectionTitle}
          </p>
          <h1 className="text-xl font-bold mt-1">{currentLesson.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!completed ? (
              <button
                onClick={markComplete}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition"
              >
                Mark as Complete
              </button>
            ) : (
              <span className="text-success text-sm font-medium flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Completed
              </span>
            )}

            <div className="flex gap-2 ml-auto">
              {prevLessonId && (
                <Link
                  href={`/courses/${course.slug}/learn/${prevLessonId}`}
                  className="text-sm px-3 py-2 border border-border rounded-lg hover:bg-muted transition"
                >
                  Previous
                </Link>
              )}
              {nextLessonId && (
                <Link
                  href={`/courses/${course.slug}/learn/${nextLessonId}`}
                  className="text-sm px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                >
                  Next Lesson
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar: Lesson list */}
      <div className="w-full lg:w-80 border-l border-border bg-muted/30 overflow-y-auto">
        <div className="p-4 border-b border-border">
          <Link
            href={`/courses/${course.slug}`}
            className="text-sm text-primary hover:underline"
          >
            &larr; Back to course
          </Link>
          <h2 className="font-semibold mt-2">{course.title}</h2>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{progress}% complete</span>
              <span>
                {completedSet.size}/{totalLessons}
              </span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {sections.map((section) => (
          <div key={section.id}>
            <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
              {section.title}
            </div>
            {section.lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/courses/${course.slug}/learn/${lesson.id}`}
                className={`block px-4 py-3 text-sm border-b border-border hover:bg-muted/50 transition ${
                  lesson.id === currentLesson.id
                    ? "bg-primary/5 border-l-2 border-l-primary"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {completedSet.has(lesson.id) ? (
                    <svg
                      className="w-4 h-4 text-success flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-border flex-shrink-0" />
                  )}
                  <span className="line-clamp-1">{lesson.title}</span>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
