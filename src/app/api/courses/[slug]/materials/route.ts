import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { detectFileType, extractText } from "@/lib/textExtract";

export const runtime = "nodejs";

// ─── Helpers ────────────────────────────────────────
async function getCourseAndCheckEnrollment(
  slug: string,
  userId: string
): Promise<{ courseId: string; isInstructor: boolean } | null> {
  const course = await db.course.findUnique({
    where: { slug },
    select: { id: true, instructorId: true },
  });
  if (!course) return null;

  const isInstructor = course.instructorId === userId;
  if (!isInstructor) {
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
    });
    if (!enrollment) return null;
  }
  return { courseId: course.id, isInstructor };
}

// ─── GET /api/courses/[slug]/materials ──────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const access = await getCourseAndCheckEnrollment(slug, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Course not found or not enrolled" }, { status: 404 });
  }

  const materials = await db.courseMaterial.findMany({
    where: { courseId: access.courseId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      filename: true,
      fileType: true,
      createdAt: true,
      uploadedBy: true,
      user: { select: { name: true } },
      // Don't return extractedText in the list — can be large
    },
  });

  return NextResponse.json(materials);
}

// ─── POST /api/courses/[slug]/materials ─────────────
// Accepts multipart/form-data with:
//   file  – File object (PDF, DOCX, TXT)
//   title – string (optional, defaults to filename)
//
// OR application/json with:
//   title   – string
//   content – string (pasted text)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const access = await getCourseAndCheckEnrollment(slug, session.user.id);
  if (!access) {
    return NextResponse.json({ error: "Course not found or not enrolled" }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  let title = "";
  let filename = "";
  let fileType: "pdf" | "docx" | "txt" | "text" = "text";
  let extractedText = "";

  if (contentType.includes("multipart/form-data")) {
    // File upload
    const form = await req.formData();
    const file = form.get("file");
    const titleField = form.get("title");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 10 MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
    }

    const detected = detectFileType(file.name, file.type);
    if (!detected) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
        { status: 400 }
      );
    }

    filename = file.name;
    fileType = detected;
    title =
      typeof titleField === "string" && titleField.trim()
        ? titleField.trim()
        : file.name.replace(/\.[^.]+$/, "");

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      extractedText = await extractText(buffer, detected);
    } catch (err) {
      return NextResponse.json(
        { error: "Failed to extract text from file: " + (err instanceof Error ? err.message : "unknown error") },
        { status: 422 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: "Could not extract any text from this file." },
        { status: 422 }
      );
    }
  } else {
    // Pasted text (JSON body)
    const body = await req.json();
    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    title = body.title?.trim() || "Pasted notes";
    filename = "pasted-text.txt";
    fileType = "text";
    extractedText = String(body.content).slice(0, 60_000);
  }

  const material = await db.courseMaterial.create({
    data: {
      courseId: access.courseId,
      title,
      filename,
      fileType,
      extractedText,
      uploadedBy: session.user.id,
    },
    select: {
      id: true,
      title: true,
      filename: true,
      fileType: true,
      createdAt: true,
    },
  });

  return NextResponse.json(material, { status: 201 });
}
