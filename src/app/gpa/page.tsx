"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────
interface GpaCourse {
  id: string;
  name: string;
  year: string;
  semester?: string | null;
  courseType: string;
  creditHours: number;
  grade: string;
  gradePoints: number;
  createdAt: string;
}

interface AiAdvice {
  answer: string;
  recommendations: string[];
}

interface ForecastResult {
  currentGPA: number;
  totalCredits: number;
  targetLabel: string;
  targetGPA: number;
  remainingCredits: number;
  neededGPA: number;
  advice: string;
}

// ─── Constants ──────────────────────────────────────
const GRADE_MAP: Record<string, number> = {
  "A+": 5, A: 4, "B+": 3, B: 2, "C+": 1, C: 0, "D+": 0, D: 0, NE: 0, P: 0, F: 0, LT: 0, INC: 0,
};
const GRADE_OPTIONS = Object.keys(GRADE_MAP);
const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"];
const SEMESTERS = ["", "Semester 1", "Semester 2"];
const COURSE_TYPES = ["Full", "Half"];

type Tab = "dashboard" | "add" | "courses" | "forecast" | "ai";

// ─── Helpers ────────────────────────────────────────
function calcGPA(courses: GpaCourse[]) {
  if (courses.length === 0) return { gpa: 0, totalCredits: 0 };
  let totalCredits = 0;
  let totalPoints = 0;
  for (const c of courses) {
    totalCredits += c.creditHours;
    totalPoints += c.gradePoints * c.creditHours;
  }
  return {
    gpa: totalCredits > 0 ? +(totalPoints / totalCredits).toFixed(4) : 0,
    totalCredits,
  };
}

function getClassification(gpa: number) {
  if (gpa >= 3.75) return { label: "Distinction", color: "text-emerald-600 bg-emerald-50" };
  if (gpa >= 3.25) return { label: "Meritorious", color: "text-blue-600 bg-blue-50" };
  if (gpa >= 2.68) return { label: "Credit", color: "text-amber-600 bg-amber-50" };
  return { label: "Pass", color: "text-gray-600 bg-gray-50" };
}

// ─── Main Page ──────────────────────────────────────
export default function GpaCalculatorPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [courses, setCourses] = useState<GpaCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/gpa/courses");
      if (!res.ok) throw new Error("Failed to fetch");
      setCourses(await res.json());
    } catch {
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { key: "add", label: "Add Course", icon: "M12 4v16m8-8H4" },
    { key: "courses", label: "My Courses", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { key: "forecast", label: "Forecast", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { key: "ai", label: "Ask AI", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">GPA Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your grades, forecast your classification, and get AI advice
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          <svg className="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* Tab Content */}
      {tab === "dashboard" && <DashboardTab courses={courses} />}
      {tab === "add" && (
        <AddCourseTab
          onAdded={() => {
            fetchCourses();
            setTab("dashboard");
          }}
        />
      )}
      {tab === "courses" && (
        <CoursesTab courses={courses} onChanged={fetchCourses} />
      )}
      {tab === "forecast" && <ForecastTab courses={courses} />}
      {tab === "ai" && <AskAiTab courses={courses} />}
    </div>
  );
}

// ─── Dashboard Tab ──────────────────────────────────
function DashboardTab({ courses }: { courses: GpaCourse[] }) {
  const { gpa, totalCredits } = calcGPA(courses);
  const classification = getClassification(gpa);

  // Group by year
  const byYear: Record<string, GpaCourse[]> = {};
  for (const c of courses) {
    if (!byYear[c.year]) byYear[c.year] = [];
    byYear[c.year].push(c);
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/10">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Cumulative GPA</p>
          <p className="text-3xl font-bold text-primary mt-1">{gpa}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Classification</p>
          <span className={`inline-block mt-2 text-sm font-semibold px-3 py-1 rounded-full ${classification.color}`}>
            {classification.label}
          </span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Credits</p>
          <p className="text-3xl font-bold mt-1">{totalCredits}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-border">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Courses</p>
          <p className="text-3xl font-bold mt-1">{courses.length}</p>
        </div>
      </div>

      {/* GPA Scale Reference */}
      <div className="bg-white rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold mb-3">Classification Scale</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Distinction (3.75+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Meritorious (3.25+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Credit (2.68+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>Pass (below 2.68)</span>
          </div>
        </div>
      </div>

      {/* Year Cards */}
      {courses.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-lg font-medium">No courses yet</p>
          <p className="text-sm mt-1">Add your first course to start tracking your GPA</p>
        </div>
      ) : (
        Object.entries(byYear)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([year, yearCourses]) => {
            const yearStats = calcGPA(yearCourses);
            const yearClass = getClassification(yearStats.gpa);
            return (
              <div key={year} className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted/50 flex items-center justify-between">
                  <h3 className="font-semibold">{year}</h3>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {yearCourses.length} course{yearCourses.length !== 1 ? "s" : ""} &middot; {yearStats.totalCredits} credits
                    </span>
                    <span className="font-bold text-primary">GPA: {yearStats.gpa}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${yearClass.color}`}>
                      {yearClass.label}
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-border">
                  {yearCourses.map((c) => (
                    <div key={c.id} className="px-4 py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium">{c.name}</span>
                        {c.semester && (
                          <span className="text-xs text-muted-foreground">{c.semester}</span>
                        )}
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {c.courseType}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">{c.creditHours} cr</span>
                        <span className={`font-bold ${GRADE_MAP[c.grade] >= 3 ? "text-emerald-600" : GRADE_MAP[c.grade] >= 1 ? "text-amber-600" : "text-red-500"}`}>
                          {c.grade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
      )}
    </div>
  );
}

// ─── Add Course Tab ─────────────────────────────────
function AddCourseTab({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("");
  const [year, setYear] = useState("Year 1");
  const [semester, setSemester] = useState("");
  const [courseType, setCourseType] = useState("Full");
  const [creditHours, setCreditHours] = useState("1");
  const [grade, setGrade] = useState("A+");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/gpa/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          year,
          semester: semester || null,
          courseType,
          creditHours: Number(creditHours),
          grade,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add course");
      }

      setSuccess(`${name} added successfully!`);
      setName("");
      setCreditHours("1");
      setGrade("A+");
      onAdded();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Add a Course</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Course Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Introduction to Computing"
              className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition bg-white"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition bg-white"
              >
                {COURSE_TYPES.map((t) => (
                  <option key={t} value={t}>{t} Course</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Semester <span className="text-muted-foreground">(optional)</span>
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition bg-white"
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>{s || "Not specified"}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Credit Hours</label>
              <input
                type="number"
                value={creditHours}
                onChange={(e) => setCreditHours(e.target.value)}
                min="0.5"
                step="0.5"
                required
                className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Grade</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition bg-white"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g} ({GRADE_MAP[g]} pts)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Course"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Courses Tab ────────────────────────────────────
function CoursesTab({
  courses,
  onChanged,
}: {
  courses: GpaCourse[];
  onChanged: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<GpaCourse>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  const byYear: Record<string, GpaCourse[]> = {};
  for (const c of courses) {
    if (!byYear[c.year]) byYear[c.year] = [];
    byYear[c.year].push(c);
  }

  const handleEdit = (course: GpaCourse) => {
    setEditingId(course.id);
    setEditData({
      name: course.name,
      year: course.year,
      courseType: course.courseType,
      creditHours: course.creditHours,
      grade: course.grade,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    const res = await fetch(`/api/gpa/courses/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editData),
    });
    if (res.ok) {
      setEditingId(null);
      onChanged();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    setDeleting(id);
    const res = await fetch(`/api/gpa/courses/${id}`, { method: "DELETE" });
    if (res.ok) onChanged();
    setDeleting(null);
  };

  if (courses.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">No courses added yet</p>
        <p className="text-sm mt-1">Go to &quot;Add Course&quot; to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(byYear)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([year, yearCourses]) => (
          <div key={year} className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 font-semibold">{year}</div>
            <div className="divide-y divide-border">
              {yearCourses.map((c) =>
                editingId === c.id ? (
                  <div key={c.id} className="px-4 py-3 bg-primary/5">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                      <input
                        value={editData.name || ""}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="px-2 py-1.5 border border-border rounded-lg col-span-2 sm:col-span-1"
                        placeholder="Course name"
                      />
                      <select
                        value={editData.year || "Year 1"}
                        onChange={(e) => setEditData({ ...editData, year: e.target.value })}
                        className="px-2 py-1.5 border border-border rounded-lg bg-white"
                      >
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select
                        value={editData.courseType || "Full"}
                        onChange={(e) => setEditData({ ...editData, courseType: e.target.value })}
                        className="px-2 py-1.5 border border-border rounded-lg bg-white"
                      >
                        {COURSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input
                        type="number"
                        value={editData.creditHours || 1}
                        onChange={(e) => setEditData({ ...editData, creditHours: Number(e.target.value) })}
                        className="px-2 py-1.5 border border-border rounded-lg"
                        min="0.5"
                        step="0.5"
                      />
                      <select
                        value={editData.grade || "A+"}
                        onChange={(e) => setEditData({ ...editData, grade: e.target.value })}
                        className="px-2 py-1.5 border border-border rounded-lg bg-white"
                      >
                        {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleSave}
                        className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:opacity-90 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={c.id} className="px-4 py-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-medium truncate">{c.name}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0">
                        {c.courseType}
                      </span>
                      <span className="text-muted-foreground flex-shrink-0">{c.creditHours} cr</span>
                      <span className={`font-bold flex-shrink-0 ${GRADE_MAP[c.grade] >= 3 ? "text-emerald-600" : GRADE_MAP[c.grade] >= 1 ? "text-amber-600" : "text-red-500"}`}>
                        {c.grade}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-2">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-xs px-2.5 py-1 border border-border rounded-lg hover:bg-muted transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
                        className="text-xs px-2.5 py-1 text-danger border border-danger/30 rounded-lg hover:bg-danger/5 transition disabled:opacity-50"
                      >
                        {deleting === c.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── Forecast Tab ───────────────────────────────────
function ForecastTab({ courses }: { courses: GpaCourse[] }) {
  const [target, setTarget] = useState("distinction");
  const [remainingCredits, setRemainingCredits] = useState("60");
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { gpa } = calcGPA(courses);

  const handleForecast = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/gpa/forecast?target=${target}&remainingCredits=${remainingCredits}`
      );
      if (res.ok) {
        setResult(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-1">GPA Forecast</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Calculate what you need to achieve your target classification
        </p>

        {courses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Add some courses first to use the forecast tool</p>
          </div>
        ) : (
          <>
            <div className="bg-muted/50 rounded-xl p-4 mb-4">
              <p className="text-sm text-muted-foreground">Your current GPA</p>
              <p className="text-2xl font-bold text-primary">{gpa}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {getClassification(gpa).label}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target Classification</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition bg-white"
                >
                  <option value="distinction">Distinction (3.75+)</option>
                  <option value="merit">Meritorious (3.25+)</option>
                  <option value="credit">Credit (2.68+)</option>
                  <option value="pass">Pass</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Remaining Credit Hours
                </label>
                <input
                  type="number"
                  value={remainingCredits}
                  onChange={(e) => setRemainingCredits(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                />
              </div>

              <button
                onClick={handleForecast}
                disabled={loading}
                className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition disabled:opacity-50"
              >
                {loading ? "Calculating..." : "Calculate Forecast"}
              </button>
            </div>

            {result && (
              <div className="mt-6 p-4 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent">
                <h3 className="font-semibold mb-2">Forecast Result</h3>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">Current GPA</p>
                    <p className="font-bold">{result.currentGPA}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Target</p>
                    <p className="font-bold">{result.targetLabel} ({result.targetGPA})</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Remaining Credits</p>
                    <p className="font-bold">{result.remainingCredits}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Needed GPA</p>
                    <p className={`font-bold ${result.neededGPA <= 0 ? "text-emerald-600" : result.neededGPA > 5 ? "text-red-500" : "text-amber-600"}`}>
                      {result.neededGPA <= 0 ? "Already achieved!" : result.neededGPA}
                    </p>
                  </div>
                </div>
                <div className={`text-sm p-3 rounded-lg ${result.neededGPA <= 0 ? "bg-emerald-50 text-emerald-700" : result.neededGPA > 5 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                  {result.advice}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Ask AI Tab ─────────────────────────────────────
function AskAiTab({ courses }: { courses: GpaCourse[] }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<AiAdvice | null>(null);
  const [error, setError] = useState("");

  const { gpa, totalCredits } = calcGPA(courses);
  const classification = getClassification(gpa);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setError("");
    setAdvice(null);
    setLoading(true);

    try {
      const res = await fetch("/api/gpa/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI request failed");
      }
      setAdvice(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Can I still get distinction?",
    "What grades do I need next semester?",
    "Which courses are pulling my GPA down?",
    "Create a study plan based on my weak courses",
    "How is my academic performance trending?",
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Snapshot card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/10">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">
          Your snapshot for AI advice
        </p>
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-2xl font-bold text-primary">{gpa}</p>
            <p className="text-xs text-muted-foreground">Cumulative GPA</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totalCredits}</p>
            <p className="text-xs text-muted-foreground">Total credits</p>
          </div>
          <div>
            <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${classification.color}`}>
              {classification.label}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Classification</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{courses.length}</p>
            <p className="text-xs text-muted-foreground">Courses</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">
            ✨
          </div>
          <div>
            <h2 className="font-semibold">Ask Splash AI about your GPA</h2>
            <p className="text-sm text-muted-foreground">
              Get personalised advice based on your actual grades
            </p>
          </div>
        </div>

        {courses.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-4">
            Add some courses first so the AI has data to advise on.
          </div>
        )}

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question here..."
          rows={3}
          className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none text-sm mb-3"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAsk();
          }}
        />

        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setQuestion(s)}
              className="text-xs px-3 py-1.5 border border-border rounded-full hover:bg-muted transition"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={handleAsk}
          disabled={loading || !question.trim() || courses.length === 0}
          className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Thinking...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get advice
            </>
          )}
        </button>
        <p className="text-xs text-muted-foreground text-center mt-2">Ctrl+Enter to send</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-4 rounded-xl">
          <strong>Error:</strong> {error}
        </div>
      )}

      {advice && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <span className="text-lg">✨</span>
              <span className="font-semibold text-amber-800">Splash AI says</span>
            </div>
            <div className="px-6 py-5 whitespace-pre-wrap leading-relaxed text-sm">
              {advice.answer}
            </div>
          </div>

          {advice.recommendations.length > 0 && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-6 py-3 border-b border-border">
                <span className="font-semibold">Recommendations</span>
              </div>
              <ul className="divide-y divide-border">
                {advice.recommendations.map((rec, i) => (
                  <li key={i} className="px-6 py-3 text-sm flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
