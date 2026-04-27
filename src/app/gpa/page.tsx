"use client";

/**
 * /gpa — Dashboard.
 * Mirrors RicoGPA's client/src/pages/Dashboard.js.
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import YearCard from "@/components/gpa/YearCard";
import { getClassification } from "@/lib/gpa";

interface Course {
  id: string;
  name: string;
  courseType: string;
  creditHours: number;
  grade: string;
  gradePoints: number;
}

interface DashboardData {
  gpa: number;
  totalCredits: number;
  totalCourses: number;
  byYear: Record<string, { courses: Course[]; gpa: number; totalCredits: number }>;
}

const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"];

export default function GpaDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/gpa/me")
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load dashboard"));
  }, []);

  if (error) {
    return <p className="error">{error}</p>;
  }
  if (!data) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const classification = getClassification(data.gpa);

  return (
    <div>
      <h2>Welcome{session?.user?.email ? `, ${session.user.email}` : ""}</h2>

      <div className="summary-cards">
        <div className="card">
          <h3>Cumulative GPA</h3>
          <p className="big-number">{data.gpa.toFixed(2)}</p>
          <span className="badge">{classification}</span>
        </div>
        <div className="card">
          <h3>Total Credits</h3>
          <p className="big-number">{data.totalCredits}</p>
        </div>
        <div className="card">
          <h3>Total Courses</h3>
          <p className="big-number">{data.totalCourses}</p>
        </div>
      </div>

      <h2>Courses by Year</h2>
      {YEARS.map((year) => {
        const yearData = data.byYear[year];
        if (!yearData || yearData.courses.length === 0) return null;
        return (
          <YearCard
            key={year}
            year={year}
            courses={yearData.courses}
            yearGPA={yearData.gpa}
            yearCredits={yearData.totalCredits}
          />
        );
      })}

      {data.totalCourses === 0 && (
        <p className="muted">
          No courses added yet.{" "}
          <Link href="/gpa/add-course" style={{ color: "#4361ee" }}>
            Go to Add Course
          </Link>{" "}
          to get started.
        </p>
      )}
    </div>
  );
}
