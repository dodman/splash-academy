-- Add GPA tracker, course materials, generated quizzes,
-- discussions, Q&A tables, and misc column additions.
-- NOTE: All tables below were created via prisma db push prior to this
-- migration being added. We use CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- to safely baseline the current production schema state.

-- GpaCourse
CREATE TABLE IF NOT EXISTS "GpaCourse" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "year"        TEXT NOT NULL,
    "semester"    TEXT,
    "courseType"  TEXT NOT NULL,
    "creditHours" DOUBLE PRECISION NOT NULL,
    "grade"       TEXT NOT NULL,
    "gradePoints" DOUBLE PRECISION NOT NULL,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId"      TEXT NOT NULL,
    CONSTRAINT "GpaCourse_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "GpaCourse"
    ADD CONSTRAINT "GpaCourse_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

-- CourseMaterial
CREATE TABLE IF NOT EXISTS "CourseMaterial" (
    "id"            TEXT NOT NULL,
    "courseId"      TEXT NOT NULL,
    "title"         TEXT NOT NULL,
    "filename"      TEXT NOT NULL,
    "fileType"      TEXT NOT NULL,
    "extractedText" TEXT NOT NULL,
    "uploadedBy"    TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CourseMaterial_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CourseMaterial"
    ADD CONSTRAINT "CourseMaterial_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

ALTER TABLE "CourseMaterial"
    ADD CONSTRAINT "CourseMaterial_uploadedBy_fkey"
    FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

-- GeneratedQuiz
CREATE TABLE IF NOT EXISTS "GeneratedQuiz" (
    "id"           TEXT NOT NULL,
    "courseId"     TEXT NOT NULL,
    "topic"        TEXT,
    "difficulty"   TEXT NOT NULL DEFAULT 'medium',
    "questionType" TEXT NOT NULL DEFAULT 'multiple-choice',
    "questions"    JSONB NOT NULL,
    "generatedBy"  TEXT NOT NULL,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedQuiz_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "GeneratedQuiz"
    ADD CONSTRAINT "GeneratedQuiz_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

ALTER TABLE "GeneratedQuiz"
    ADD CONSTRAINT "GeneratedQuiz_generatedBy_fkey"
    FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

-- Discussion
CREATE TABLE IF NOT EXISTS "Discussion" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "courseId"  TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Discussion"
    ADD CONSTRAINT "Discussion_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

ALTER TABLE "Discussion"
    ADD CONSTRAINT "Discussion_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

-- Question (Q&A)
CREATE TABLE IF NOT EXISTS "Question" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "courseId"  TEXT NOT NULL,
    "lessonId"  TEXT,
    "title"     TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Question"
    ADD CONSTRAINT "Question_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

ALTER TABLE "Question"
    ADD CONSTRAINT "Question_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

ALTER TABLE "Question"
    ADD CONSTRAINT "Question_lessonId_fkey"
    FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE
    NOT VALID;

-- Answer (Q&A replies)
CREATE TABLE IF NOT EXISTS "Answer" (
    "id"         TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "body"       TEXT NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Answer"
    ADD CONSTRAINT "Answer_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

ALTER TABLE "Answer"
    ADD CONSTRAINT "Answer_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

-- Add liveClassLink to Course (if not already present)
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "liveClassLink" TEXT;

-- Regenerate Prisma client after this migration
