/**
 * POST /api/chat
 * Streaming chat endpoint — SSE stream of delta tokens.
 * Identical behaviour to Splash AI's chat route, running natively in Academy.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAIProvider } from "@/providers/ai";
import { z } from "zod";
import {
  buildTutorContext,
  persistUserMessage,
  persistAssistantMessage,
  generateSessionTitle,
  createSession,
} from "@/services/ai/tutorService";
import { isTutorMode } from "@/lib/modes";
import type { TutorMode } from "@/generated/prisma/client";

export const runtime = "nodejs";
export const maxDuration = 120;

const LIMITS = { chat: 60 };

function rateLimit(_key: string, _limit: number) {
  // Simplified — full rate limiting can be added later
  return { ok: true };
}

const bodySchema = z.object({
  message: z.string().trim().min(1).max(16000),
  sessionId: z.string().optional(),
  courseId: z.string().optional(),
  mode: z
    .enum([
      "LEARN", "PRACTICE", "REVISION", "DIRECT",
      "GENERAL", "CODE", "WRITE", "RESEARCH", "BUSINESS",
    ] as const)
    .optional()
    .default("GENERAL"),
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rl = rateLimit(`chat:${userId}`, LIMITS.chat);
  if (!rl.ok) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { message, courseId, mode } = body;
  let { sessionId } = body;

  // Auto-create a session if none provided
  if (!sessionId) {
    const tutorMode = isTutorMode(mode as Parameters<typeof isTutorMode>[0]) ? mode : "GENERAL";
    const newSession = await createSession({
      userId,
      courseId: courseId ?? null,
      mode: (courseId ? (tutorMode === "GENERAL" ? "LEARN" : tutorMode) : mode) as TutorMode,
    });
    sessionId = newSession.id;
  }

  // Persist user message
  await persistUserMessage({ sessionId, content: message });

  let context: Awaited<ReturnType<typeof buildTutorContext>>;
  try {
    context = await buildTutorContext({ userId, sessionId, userMessage: message });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Context build failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { system, messages, citations, mode: sessionMode } = context;
  const ai = getAIProvider();
  const selectedModel = ai.selectModel(sessionMode, message.length);

  // Is this the first message? Auto-generate title in background
  const isFirstMessage = context.session.messages.length <= 1;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: string) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));

      // First frame — session ID + citations + model
      send(
        "meta",
        JSON.stringify({ sessionId, citations, model: selectedModel })
      );

      const streamIterable = ai.chatStream({
        system,
        messages,
        temperature: 0.5,
        model: selectedModel,
      });

      let fullText = "";
      try {
        for await (const delta of streamIterable) {
          fullText += delta;
          send("delta", JSON.stringify({ text: delta }));
        }

        // Persist assistant message
        const usage = await streamIterable.usagePromise?.catch(() => null);
        await persistAssistantMessage({
          sessionId,
          content: fullText,
          citations,
          tokensUsed: usage?.totalTokens,
        });

        // Auto-title on first message
        if (isFirstMessage) {
          generateSessionTitle(message, sessionMode).then((title) => {
            if (title && title !== "New chat") {
              // Fire-and-forget title update
              import("@/lib/db").then(({ db }) =>
                db.chatSession.update({
                  where: { id: sessionId },
                  data: { title },
                })
              );
            }
          });
        }

        send("done", JSON.stringify({ sessionId }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        send("error", JSON.stringify({ error: msg }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
