/**
 * RicoGPA-style YearCard.
 * Mirrors RicoGPA's client/src/components/YearCard.js.
 */

import { getClassification } from "@/lib/gpa";

export interface YearCourse {
  id: string;
  name: string;
  courseType: string;
  creditHours: number;
  grade: string;
  gradePoints: number;
}

export default function YearCard({
  year,
  courses,
  yearGPA,
  yearCredits,
}: {
  year: string;
  courses: YearCourse[];
  yearGPA: number;
  yearCredits: number;
}) {
  return (
    <div className="year-card">
      <div className="year-header">
        <h3>{year}</h3>
        <div className="year-stats">
          <span className="year-gpa">
            GPA: <strong>{yearGPA.toFixed(2)}</strong>
          </span>
          <span className="badge">{getClassification(yearGPA)}</span>
          <span className="year-credits">{yearCredits} credits</span>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Course</th>
            <th>Type</th>
            <th>Credits</th>
            <th>Grade</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.courseType}</td>
              <td>{c.creditHours}</td>
              <td>{c.grade}</td>
              <td>{c.gradePoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
