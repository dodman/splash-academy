/**
 * GET /api/gpa/forecast?target=distinction&remainingCredits=60
 * Mirrors RicoGPA's GET /api/gpa/forecast exactly.
 *
 * Computes the GPA needed in remaining credits to reach a target classification.
 *
 * Response:
 *   { currentGPA, totalCredits, targetLabel, targetGPA, remainingCredits, neededGPA, advice }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  calcGPA,
  CLASSIFICATIONS,
  GRADE_MAP,
  type ClassificationKey,
} from "@/lib/gpa";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const target = url.searchParams.get("target") as ClassificationKey | null;
  const remaining = Number(url.searchParams.get("remainingCredits")) || 60;

  if (!target || !CLASSIFICATIONS[target]) {
    return NextResponse.json(
      { message: "Invalid target. Use: pass, credit, merit, distinction" },
      { status: 400 }
    );
  }

  const courses = await db.gpaCourse.findMany({
    where: { userId: session.user.id },
  });
  const { gpa, totalCredits, totalPoints } = calcGPA(courses);

  const classification = CLASSIFICATIONS[target];
  const targetGPA = classification.minGPA;
  const neededTotal = targetGPA * (totalCredits + remaining);
  const neededPoints = neededTotal - totalPoints;
  const neededGPA = remaining > 0 ? +(neededPoints / remaining).toFixed(4) : 0;

  let advice = "";
  if (neededGPA <= 0) {
    advice = `You have already reached ${classification.label}! Keep it up.`;
  } else if (neededGPA > 5.0) {
    advice = `Unfortunately, reaching ${classification.label} is not possible with ${remaining} remaining credits. Consider adding more credits or adjusting your target.`;
  } else {
    // Find smallest grade label whose point value covers neededGPA
    const sorted = Object.entries(GRADE_MAP).sort((a, b) => a[1] - b[1]);
    let gradeLabel = "A+";
    for (const [label, pts] of sorted) {
      if (pts >= neededGPA) {
        gradeLabel = label;
        break;
      }
    }
    advice = `You need around a ${gradeLabel} average (${neededGPA} GPA) in your remaining ${remaining} credits to reach ${classification.label}.`;
  }

  return NextResponse.json({
    currentGPA: gpa,
    totalCredits,
    targetLabel: classification.label,
    targetGPA,
    remainingCredits: remaining,
    neededGPA,
    advice,
  });
}
