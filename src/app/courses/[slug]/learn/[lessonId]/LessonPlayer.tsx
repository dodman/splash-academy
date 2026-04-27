"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";

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
  course: { id: string; title: string; slug: string; liveClassLink?: string | null };
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
  const [showVideo, setShowVideo] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const savedTimeRef = useRef<number>(0);

  const handleCloseVideo = useCallback(() => {
    if (videoRef.current) {
      savedTimeRef.current = videoRef.current.currentTime;
      videoRef.current.pause();
    }
    setShowVideo(false);
  }, []);

  const handleResumeVideo = useCallback(() => {
    setShowVideo(true);
  }, []);

  const handleVideoLoaded = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && savedTimeRef.current > 0) {
      el.currentTime = savedTimeRef.current;
      el.play().catch(() => {});
    }
  }, []);

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
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\s?]+)/
    );
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* Video + Controls */}
      <div className="flex-1 flex flex-col">
        {/* Video */}
        <div className="bg-black aspect-video w-full relative">
          {showVideo && currentLesson.videoUrl ? (
            <>
              {isDirectVideo(currentLesson.videoUrl) ? (
                <video
                  ref={handleVideoLoaded}
                  src={currentLesson.videoUrl}
                  controls
                  className="w-full h-full"
                  controlsList="nodownload"
                />
              ) : (
                <iframe
                  src={getEmbedUrl(currentLesson.videoUrl)}
                  title={currentLesson.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              )}
              {/* Cancel / Close Video Button */}
              <button
                onClick={handleCloseVideo}
                className="absolute top-3 right-3 w-9 h-9 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors z-10"
                title="Close video"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : !currentLesson.videoUrl ? (
            <div className="w-full h-full flex items-center justify-center text-white/50">
              No video uploaded for this lesson
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <p className="text-white/50">Video closed</p>
              <button
                onClick={handleResumeVideo}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resume Video
              </button>
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
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
              </svg>
              Home
            </Link>
            <Link
              href={`/courses/${course.slug}`}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>

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
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to course
          </Link>
          {course.liveClassLink && (
            <a
              href={course.liveClassLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Join Live Class
            </a>
          )}
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

        {/* Community link */}
        <div className="px-4 py-2 border-b border-border space-y-1">
          <Link
            href={`/courses/${course.slug}/learn/community`}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Community &middot; Q&A &middot; Discussion
          </Link>
          <Link
            href={`/courses/${course.slug}/learn/ai-study`}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            ✨ AI Study &middot; Materials &middot; Quizzes
          </Link>
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
                  {lesson.duration > 0 && (
                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                      {Math.ceil(lesson.duration / 60)} min
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
