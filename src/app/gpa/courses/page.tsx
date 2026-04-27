"use client";

/**
 * /gpa/courses — flat list of courses, with edit + delete.
 * Edit form keeps RicoGPA's 4-field model: name, year, courseType, grade.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { GRADE_OPTIONS } from "@/lib/gpa";

interface Course {
  id: string;
  name: string;
  year: string;
  courseType: string;
  creditHours: number;
  grade: string;
  gradePoints: number;
}

const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Course>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/gpa/courses");
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      setCourses(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (c: Course) => {
    setEditId(c.id);
    setEditForm({
      name: c.name,
      year: c.year,
      courseType: c.courseType,
      grade: c.grade,
    });
    setError("");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editId) return;
    setBusy(editId);
    setError("");
    try {
      const res = await fetch(`/api/gpa/course/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || d.error || "Failed to save");
      }
      cancelEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    setBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/gpa/course/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || d.error || "Failed to delete");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusy(null);
    }
  };

  if (!courses && !error) {
    return <div className="loading">Loading courses...</div>;
  }

  return (
    <div>
      <h2>My Courses</h2>
      {error && <p className="error">{error}</p>}
      {courses && courses.length === 0 && (
        <p className="muted">
          No courses yet.{" "}
          <Link href="/gpa/add-course" style={{ color: "#4361ee" }}>
            Add your first course
          </Link>
          .
        </p>
      )}

      {courses && courses.length > 0 && (
        <div className="year-card">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Year</th>
                <th>Type</th>
                <th>Credits</th>
                <th>Grade</th>
                <th>Points</th>
                <th style={{ width: 130 }}></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) =>
                editId === c.id ? (
                  <tr key={c.id}>
                    <td>
                      <input
                        value={editForm.name ?? ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={editForm.year ?? "Year 1"}
                        onChange={(e) =>
                          setEditForm({ ...editForm, year: e.target.value })
                        }
                      >
                        {YEARS.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={editForm.courseType ?? "Full"}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            courseType: e.target.value,
                          })
                        }
                      >
                        <option value="Full">Full</option>
                        <option value="Half">Half</option>
                      </select>
                    </td>
                    <td className="muted">auto</td>
                    <td>
                      <select
                        value={editForm.grade ?? "A+"}
                        onChange={(e) =>
                          setEditForm({ ...editForm, grade: e.target.value })
                        }
                      >
                        {GRADE_OPTIONS.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="muted">auto</td>
                    <td>
                      <button
                        className="btn"
                        onClick={saveEdit}
                        disabled={busy === c.id}
                        style={{ marginRight: 6, padding: "6px 10px", fontSize: "0.82rem" }}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={cancelEdit}
                        style={{ padding: "6px 10px", fontSize: "0.82rem" }}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.year}</td>
                    <td>{c.courseType}</td>
                    <td>{c.creditHours}</td>
                    <td>{c.grade}</td>
                    <td>{c.gradePoints}</td>
                    <td>
                      <button
                        className="btn btn-ghost"
                        onClick={() => startEdit(c)}
                        disabled={busy === c.id}
                        style={{ marginRight: 6, padding: "6px 10px", fontSize: "0.82rem" }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => remove(c.id)}
                        disabled={busy === c.id}
                        style={{ padding: "6px 10px", fontSize: "0.82rem" }}
                      >
                        {busy === c.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
