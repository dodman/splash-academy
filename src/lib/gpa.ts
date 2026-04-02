// UNZA Current Course Grading System
// Grade points per full course (half course = half these values)
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

export const CLASSIFICATIONS = {
  distinction: { label: "Distinction", minGPA: 3.75 },
  merit: { label: "Meritorious", minGPA: 3.25 },
  credit: { label: "Credit", minGPA: 2.68 },
  pass: { label: "Pass", minGPA: 0 },
} as const;

export type ClassificationKey = keyof typeof CLASSIFICATIONS;

export function calcGPA(
  courses: { gradePoints: number; creditHours: number }[]
) {
  if (courses.length === 0) return { gpa: 0, totalCredits: 0, totalPoints: 0 };
  let totalCredits = 0;
  let totalPoints = 0;
  for (const c of courses) {
    totalCredits += c.creditHours;
    totalPoints += c.gradePoints * c.creditHours;
  }
  return {
    gpa: totalCredits > 0 ? +(totalPoints / totalCredits).toFixed(4) : 0,
    totalCredits,
    totalPoints,
  };
}

export function getClassification(gpa: number): string {
  if (gpa >= 3.75) return "Distinction";
  if (gpa >= 3.25) return "Meritorious";
  if (gpa >= 2.68) return "Credit";
  return "Pass";
}
