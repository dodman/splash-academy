import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calcGPA, CLASSIFICATIONS, GRADE_MAP, ClassificationKey } from "@/lib/gpa";

// GET /api/gpa/forecast?target=distinction&remainingCredits=60
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target") as ClassificationKey | null;
  const remainingCredits = Number(searchParams.get("remainingCredits")) || 60;

  if (!target || !CLASSIFICATIONS[target]) {
    return NextResponse.json(
      { error: "Invalid target. Use: pass, credit, merit, distinction" },
      { status: 400 }
    );
  }

  const courses = await db.gpaCourse.findMany({
    where: { userId: session.user.id },
  });

  const { gpa, totalCredits, totalPoints } = calcGPA(courses);
  const classification = CLASSIFICATIONS[target];
  const targetGPA = classification.minGPA;
  const neededTotal = targetGPA * (totalCredits + remainingCredits);
  const neededPoints = neededTotal - totalPoints;
  const neededGPA =
    remainingCredits > 0 ? +(neededPoints / remainingCredits).toFixed(4) : 0;

  let advice = "";
  if (neededGPA <= 0) {
    advice = `You have already reached ${classification.label}! Keep it up.`;
  } else if (neededGPA > 5.0) {
    advice = `Unfortunately, reaching ${classification.label} is not possible with ${remainingCredits} remaining credits. Consider adding more credits or adjusting your target.`;
  } else {
    const sorted = Object.entries(GRADE_MAP).sort((a, b) => a[1] - b[1]);
    let gradeLabel = "A+";
    for (const [label, pts] of sorted) {
      if (pts >= neededGPA) {
        gradeLabel = label;
        break;
      }
    }
    advice = `You need around a ${gradeLabel} average (${neededGPA} GPA) in your remaining ${remainingCredits} credits to reach ${classification.label}.`;
  }

  return NextResponse.json({
    currentGPA: gpa,
    totalCredits,
    targetLabel: classification.label,
    targetGPA,
    remainingCredits,
    neededGPA,
    advice,
  });
}
