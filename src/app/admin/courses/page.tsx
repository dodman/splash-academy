"use client";

import { useState, useEffect } from "react";

interface Course {
  id: string;
  title: string;
  slug: string;
  status: string;
  price: number;
  rejectionNote: string | null;
  instructor: { id: string; name: string; email: string };
  category: { name: string };
  _count: { enrollments: number; sections: number };
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const fetchCourses = async () => {
    const res = await fetch("/api/admin/courses");
    if (res.ok) setCourses(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAction = async (
    courseId: string,
    action: string,
    rejectionNote?: string
  ) => {
    const res = await fetch(`/api/admin/courses/${courseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rejectionNote }),
    });
    if (res.ok) {
      fetchCourses();
      window.dispatchEvent(new Event("admin-notifications-refresh"));
    }
  };

  const handlePriceEdit = async (courseId: string, currentPrice: number) => {
    const newPrice = prompt("Enter new price:", currentPrice.toString());
    if (newPrice === null) return;
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      alert("Invalid price");
      return;
    }
    const res = await fetch(`/api/admin/courses/${courseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updatePrice", price }),
    });
    if (res.ok) fetchCourses();
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Delete this course permanently?")) return;
    const res = await fetch(`/api/admin/courses/${courseId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      fetchCourses();
      window.dispatchEvent(new Event("admin-notifications-refresh"));
    }
  };

  const filtered =
    filter === "ALL" ? courses : courses.filter((c) => c.status === filter);

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SUBMITTED: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-blue-100 text-blue-700",
    PUBLISHED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-muted-foreground">
        Loading...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold">Manage Courses</h1>

      {/* Filter tabs */}
      <div className="mt-4 flex gap-2 flex-wrap">
        {["ALL", "SUBMITTED", "PUBLISHED", "DRAFT", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-sm px-3 py-1.5 rounded-lg transition ${
              filter === s
                ? "bg-primary text-white"
                : "border border-border hover:bg-muted"
            }`}
          >
            {s}{" "}
            {s !== "ALL" && (
              <span className="ml-1 opacity-70">
                ({courses.filter((c) => c.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Course list */}
      <div className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No courses found.
          </p>
        ) : (
          filtered.map((course) => (
            <div
              key={course.id}
              className="border border-border rounded-lg p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{course.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${statusColors[course.status] || ""}`}
                    >
                      {course.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    By {course.instructor.name} ({course.instructor.email})
                    &middot; {course.category.name} &middot; $
                    {course.price.toFixed(2)} &middot;{" "}
                    {course._count.enrollments} students
                  </p>
                  {course.rejectionNote && (
                    <p className="text-sm text-danger mt-1">
                      Rejection note: {course.rejectionNote}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap">
                  {course.status === "SUBMITTED" && (
                    <>
                      <button
                        onClick={() =>
                          handleAction(course.id, "publish")
                        }
                        className="text-xs px-3 py-1.5 bg-success text-white rounded-lg hover:opacity-90 transition"
                      >
                        Approve & Publish
                      </button>
                      <button
                        onClick={() => {
                          const note = prompt("Reason for rejection:");
                          if (note !== null)
                            handleAction(course.id, "reject", note);
                        }}
                        className="text-xs px-3 py-1.5 bg-danger text-white rounded-lg hover:opacity-90 transition"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {course.status === "PUBLISHED" && (
                    <button
                      onClick={() =>
                        handleAction(course.id, "unpublish")
                      }
                      className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition"
                    >
                      Unpublish
                    </button>
                  )}
                  {course.status === "APPROVED" && (
                    <button
                      onClick={() =>
                        handleAction(course.id, "publish")
                      }
                      className="text-xs px-3 py-1.5 bg-success text-white rounded-lg hover:opacity-90 transition"
                    >
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => handlePriceEdit(course.id, course.price)}
                    className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition"
                  >
                    Edit Price
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="text-xs px-3 py-1.5 text-danger border border-danger/30 rounded-lg hover:bg-danger/5 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
