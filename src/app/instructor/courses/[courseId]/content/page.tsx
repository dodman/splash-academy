"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
// Video URL is now a direct input field (no separate component needed)

interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  order: number;
  isFree: boolean;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  status: string;
  sections: Section[];
}

export default function CourseContentPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  // Section form
  const [newSectionTitle, setNewSectionTitle] = useState("");

  // Section edit
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editSectionTitle, setEditSectionTitle] = useState("");

  // Lesson edit
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonVideoUrl, setEditLessonVideoUrl] = useState("");
  const [editLessonDuration, setEditLessonDuration] = useState("0");
  const [editLessonIsFree, setEditLessonIsFree] = useState(false);

  // Lesson form
  const [addingLessonTo, setAddingLessonTo] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonDuration, setLessonDuration] = useState("0");
  const [lessonIsFree, setLessonIsFree] = useState(false);

  const fetchCourse = useCallback(async () => {
    const res = await fetch(`/api/instructor/courses/${courseId}`);
    if (res.ok) {
      setCourse(await res.json());
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const addSection = async () => {
    if (!newSectionTitle.trim()) return;
    await fetch("/api/instructor/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, title: newSectionTitle }),
    });
    setNewSectionTitle("");
    fetchCourse();
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm("Delete this section and all its lessons?")) return;
    await fetch(`/api/instructor/sections/${sectionId}`, {
      method: "DELETE",
    });
    fetchCourse();
  };

  const addLesson = async (sectionId: string) => {
    if (!lessonTitle.trim()) return;
    await fetch("/api/instructor/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId,
        title: lessonTitle,
        videoUrl: lessonVideoUrl,
        duration: parseInt(lessonDuration) || 0,
        isFree: lessonIsFree,
      }),
    });
    setLessonTitle("");
    setLessonVideoUrl("");
    setLessonDuration("0");
    setLessonIsFree(false);
    setAddingLessonTo(null);
    fetchCourse();
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;
    await fetch(`/api/instructor/lessons/${lessonId}`, {
      method: "DELETE",
    });
    fetchCourse();
  };

  const startEditSection = (section: Section) => {
    setEditingSectionId(section.id);
    setEditSectionTitle(section.title);
  };

  const saveSection = async () => {
    if (!editingSectionId || !editSectionTitle.trim()) return;
    await fetch("/api/instructor/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId: editingSectionId, title: editSectionTitle }),
    });
    setEditingSectionId(null);
    setEditSectionTitle("");
    fetchCourse();
  };

  const startEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setEditLessonTitle(lesson.title);
    setEditLessonVideoUrl(lesson.videoUrl);
    setEditLessonDuration(lesson.duration.toString());
    setEditLessonIsFree(lesson.isFree);
  };

  const saveLesson = async () => {
    if (!editingLessonId || !editLessonTitle.trim()) return;
    await fetch("/api/instructor/lessons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId: editingLessonId,
        title: editLessonTitle,
        videoUrl: editLessonVideoUrl,
        duration: parseInt(editLessonDuration) || 0,
        isFree: editLessonIsFree,
      }),
    });
    setEditingLessonId(null);
    fetchCourse();
  };

  const submitForReview = async () => {
    const res = await fetch(
      `/api/instructor/courses/${courseId}/submit`,
      { method: "POST" }
    );
    if (res.ok) {
      fetchCourse();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to submit");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-danger">
        Course not found
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground mt-1">
            Manage sections and lessons
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/instructor")}
            className="text-sm px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition"
          >
            Back
          </button>
          {(course.status === "DRAFT" || course.status === "REJECTED") && (
            <button
              onClick={submitForReview}
              className="text-sm px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
            >
              Submit for Review
            </button>
          )}
          {course.status === "SUBMITTED" && (
            <span className="text-sm px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg">
              Under Review
            </span>
          )}
          {course.status === "PUBLISHED" && (
            <span className="text-sm px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
              Published
            </span>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="mt-8 space-y-6">
        {course.sections.map((section) => (
          <div
            key={section.id}
            className="border border-border rounded-lg"
          >
            <div className="px-4 py-3 bg-muted flex justify-between items-center">
              {editingSectionId === section.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editSectionTitle}
                    onChange={(e) => setEditSectionTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveSection()}
                    className="flex-1 px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                  <button
                    onClick={saveSection}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingSectionId(null)}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <h3 className="font-medium">{section.title}</h3>
              )}
              {editingSectionId !== section.id && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEditSection(section)}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="text-xs text-danger hover:underline"
                  >
                    Delete Section
                  </button>
                </div>
              )}
            </div>

            {/* Lessons */}
            <div className="divide-y divide-border">
              {section.lessons.map((lesson) => (
                <div key={lesson.id}>
                  {editingLessonId === lesson.id ? (
                    <div className="px-4 py-3 space-y-3 bg-muted/30">
                      <input
                        type="text"
                        value={editLessonTitle}
                        onChange={(e) => setEditLessonTitle(e.target.value)}
                        placeholder="Lesson title"
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editLessonVideoUrl}
                        onChange={(e) => setEditLessonVideoUrl(e.target.value)}
                        placeholder="Video URL (YouTube, Vimeo, or direct link)"
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <div className="flex gap-3">
                        <input
                          type="number"
                          value={editLessonDuration}
                          onChange={(e) => setEditLessonDuration(e.target.value)}
                          placeholder="Duration (seconds)"
                          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editLessonIsFree}
                            onChange={(e) => setEditLessonIsFree(e.target.checked)}
                          />
                          Free preview
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={saveLesson}
                          className="text-sm px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingLessonId(null)}
                          className="text-sm px-4 py-1.5 border border-border rounded-lg hover:bg-muted transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-muted-foreground"
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
                        <span className="text-sm">{lesson.title}</span>
                        {lesson.videoUrl && (
                          <span className="text-xs text-primary">Video</span>
                        )}
                        {lesson.isFree && (
                          <span className="text-xs text-success">Free</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {Math.ceil(lesson.duration / 60)} min
                        </span>
                        <button
                          onClick={() => startEditLesson(lesson)}
                          className="text-xs text-primary hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteLesson(lesson.id)}
                          className="text-xs text-danger hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Lesson Form */}
            {addingLessonTo === section.id ? (
              <div className="p-4 border-t border-border bg-muted/50 space-y-3">
                <input
                  type="text"
                  placeholder="Lesson title"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="text"
                  placeholder="Video URL (YouTube, Vimeo, or direct link)"
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Duration (seconds)"
                    value={lessonDuration}
                    onChange={(e) => setLessonDuration(e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={lessonIsFree}
                      onChange={(e) => setLessonIsFree(e.target.checked)}
                    />
                    Free preview
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => addLesson(section.id)}
                    className="text-sm px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
                  >
                    Add Lesson
                  </button>
                  <button
                    onClick={() => setAddingLessonTo(null)}
                    className="text-sm px-4 py-1.5 border border-border rounded-lg hover:bg-muted transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingLessonTo(section.id)}
                className="w-full px-4 py-3 text-sm text-primary hover:bg-primary/5 transition border-t border-border"
              >
                + Add Lesson
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Section */}
      <div className="mt-6 flex gap-2">
        <input
          type="text"
          placeholder="New section title..."
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSection()}
          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={addSection}
          className="text-sm px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
        >
          + Add Section
        </button>
      </div>
    </div>
  );
}
