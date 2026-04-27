"use client";

/**
 * /gpa/add-course — Add Course form.
 * Mirrors RicoGPA's client/src/pages/AddCourse.js.
 *
 * Fields: name, year, courseType, grade.
 * NO credit hours, NO grade points, NO semester input.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GRADE_OPTIONS } from "@/lib/gpa";

const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"];

export default function AddCoursePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    year: "Year 1",
    courseType: "Full",
    grade: "A+",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/gpa/add-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || "Failed to add course");
      }
      setSuccess("Course added!");
      setForm({ name: "", year: "Year 1", courseType: "Full", grade: "A+" });
      setTimeout(() => router.push("/gpa"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add course");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <h2>Add Course</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Course Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <select name="year" value={form.year} onChange={handleChange}>
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          name="courseType"
          value={form.courseType}
          onChange={handleChange}
        >
          <option value="Full">Full Course (1 unit)</option>
          <option value="Half">Half Course (0.5 units)</option>
        </select>
        <select name="grade" value={form.grade} onChange={handleChange}>
          {GRADE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Adding..." : "Add Course"}
        </button>
      </form>
    </div>
  );
}
