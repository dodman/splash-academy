/**
 * RicoGPA grade & GPA logic — UNZA 5-point scale.
 * Mirrors RicoGPA's server/utils/gradeMap.js and server/routes/gpa.js exactly.
 *
 * IMPORTANT
 * ─────────
 * gradePoints stored on each GpaCourse row is ALREADY weighted:
 *   gradePoints = GRADE_MAP[grade] * units
 * where units = 1 for Full course, 0.5 for Half course.
 *
 * GPA is therefore:
 *   gpa = sum(c.gradePoints) / sum(c.creditHours)
 * Do NOT multiply gradePoints by creditHours again.
 */

export const GRADE_MAP: Record<string, number> = {
  "A+": 5, // 90–100%
  A: 4, // 80–89%
  "B+": 3, // 70–79%
  B: 2, // 60–69%
  "C+": 1, // 50–59%
  C: 0, // 45–49%
  "D+": 0,
  D: 0,
  NE: 0,
  P: 0,
  F: 0,
  LT: 0,
  INC: 0,
};

export const GRADE_OPTIONS = Object.keys(GRADE_MAP);

export const COURSE_TYPES = ["Full", "Half"] as const;
export type CourseType = (typeof COURSE_TYPES)[number];

/** Full = 1 unit, Half = 0.5 units. */
export function unitsFor(courseType: string): number {
  return courseType === "Half" ? 0.5 : 1;
}

/** gradePoints = GRADE_MAP[grade] * units. Returns null if grade is invalid. */
export function gradePointsFor(grade: string, courseType: string): number | null {
  const points = GRADE_MAP[grade];
  if (points === undefined) return null;
  return points * unitsFor(courseType);
}

export const CLASSIFICATIONS = {
  distinction: { label: "Distinction", minGPA: 3.75 },
  merit: { label: "Meritorious", minGPA: 3.25 },
  credit: { label: "Credit", minGPA: 2.68 },
  pass: { label: "Pass", minGPA: 0 },
} as const;

export type ClassificationKey = keyof typeof CLASSIFICATIONS;

export function getClassification(gpa: number): string {
  if (gpa >= 3.75) return "Distinction";
  if (gpa >= 3.25) return "Meritorious";
  if (gpa >= 2.68) return "Credit";
  return "Pass";
}

/**
 * Calculate GPA from already-weighted gradePoints values.
 * gpa = sum(gradePoints) / sum(creditHours)
 */
export function calcGPA(
  courses: { gradePoints: number; creditHours: number }[]
): { gpa: number; totalCredits: number; totalPoints: number } {
  if (courses.length === 0) return { gpa: 0, totalCredits: 0, totalPoints: 0 };
  let totalCredits = 0;
  let totalPoints = 0;
  for (const c of courses) {
    totalCredits += c.creditHours;
    totalPoints += c.gradePoints; // already weighted at insert time
  }
  return {
    gpa: totalCredits > 0 ? +(totalPoints / totalCredits).toFixed(4) : 0,
    totalCredits,
    totalPoints,
  };
}
