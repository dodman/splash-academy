-- Add TutorMode enum
DO $$ BEGIN
  CREATE TYPE "TutorMode" AS ENUM (
    'LEARN', 'PRACTICE', 'REVISION', 'DIRECT',
    'GENERAL', 'CODE', 'WRITE', 'RESEARCH', 'BUSINESS'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add MessageRole enum
DO $$ BEGIN
  CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add StudentLevel enum
DO $$ BEGIN
  CREATE TYPE "StudentLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add ResponseLength enum
DO $$ BEGIN
  CREATE TYPE "ResponseLength" AS ENUM ('CONCISE', 'NORMAL', 'DETAILED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ChatSession
CREATE TABLE IF NOT EXISTS "ChatSession" (
    "id"              TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "courseId"        TEXT,
    "mode"            "TutorMode" NOT NULL DEFAULT 'GENERAL',
    "title"           TEXT NOT NULL DEFAULT 'New chat',
    "totalTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ChatSession"
    ADD CONSTRAINT "ChatSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

ALTER TABLE "ChatSession"
    ADD CONSTRAINT "ChatSession_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE
    NOT VALID;

CREATE INDEX IF NOT EXISTS "ChatSession_userId_updatedAt_idx"
    ON "ChatSession" ("userId", "updatedAt" DESC);

-- ChatMessage
CREATE TABLE IF NOT EXISTS "ChatMessage" (
    "id"         TEXT NOT NULL,
    "sessionId"  TEXT NOT NULL,
    "role"       "MessageRole" NOT NULL,
    "content"    TEXT NOT NULL,
    "citations"  JSONB,
    "tokensUsed" INTEGER,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ChatMessage"
    ADD CONSTRAINT "ChatMessage_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

CREATE INDEX IF NOT EXISTS "ChatMessage_sessionId_createdAt_idx"
    ON "ChatMessage" ("sessionId", "createdAt" ASC);

-- UserSettings
CREATE TABLE IF NOT EXISTS "UserSettings" (
    "id"              TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "level"           "StudentLevel" NOT NULL DEFAULT 'INTERMEDIATE',
    "preferredLength" "ResponseLength" NOT NULL DEFAULT 'NORMAL',
    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserSettings_userId_key" ON "UserSettings" ("userId");

ALTER TABLE "UserSettings"
    ADD CONSTRAINT "UserSettings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

-- TopicProgress
CREATE TABLE IF NOT EXISTS "TopicProgress" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "courseId"  TEXT,
    "topic"     TEXT NOT NULL,
    "mastery"   DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TopicProgress_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TopicProgress"
    ADD CONSTRAINT "TopicProgress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    NOT VALID;

ALTER TABLE "TopicProgress"
    ADD CONSTRAINT "TopicProgress_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE
    NOT VALID;
