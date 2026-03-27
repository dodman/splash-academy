import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await params;

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: { instructor: { select: { name: true } } },
  });

  if (!course || course.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Check not already enrolled
  const existing = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId: session.user.id, courseId },
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Already enrolled" }, { status: 400 });
  }

  // Free course — enroll directly
  if (course.price === 0) {
    const enrollment = await db.enrollment.create({
      data: { userId: session.user.id, courseId },
    });
    return NextResponse.json({ enrolled: true, enrollment });
  }

  // Stripe not configured — fallback to free enrollment for MVP testing
  if (!isStripeConfigured()) {
    const enrollment = await db.enrollment.create({
      data: { userId: session.user.id, courseId },
    });
    return NextResponse.json({ enrolled: true, enrollment });
  }

  // Create Stripe Checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: course.title,
            description: `Course by ${course.instructor.name}`,
          },
          unit_amount: Math.round(course.price * 100), // cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      courseId: course.id,
      userId: session.user.id,
    },
    success_url: `${process.env.AUTH_URL}/courses/${course.slug}?enrolled=true`,
    cancel_url: `${process.env.AUTH_URL}/courses/${course.slug}`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
