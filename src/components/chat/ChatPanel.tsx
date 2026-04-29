"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Send,
  Bot,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  BookOpenCheck,
  Dumbbell,
  Lightbulb,
  Zap,
  Code2,
  PenLine,
  FlaskConical,
  Briefcase,
  MessageSquare,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type TutorMode =
  | "LEARN" | "PRACTICE" | "REVISION" | "DIRECT"
  | "GENERAL" | "CODE" | "WRITE" | "RESEARCH" | "BUSINESS";

interface ModeInfo {
  label: string;
  icon: React.ElementType;
  accent: string;
  group: "tutor" | "assistant";
  tagline: string;
}

const MODES: Record<TutorMode, ModeInfo> = {
  LEARN:    { label: "Learn",     icon: Lightbulb,     accent: "text-indigo-400",  group: "tutor",     tagline: "Scaffolded teaching" },
  PRACTICE: { label: "Practice",  icon: Dumbbell,      accent: "text-violet-400",  group: "tutor",     tagline: "Drill with hints" },
  REVISION: { label: "Revision",  icon: BookOpenCheck, accent: "text-fuchsia-400", group: "tutor",     tagline: "Rapid recap" },
  DIRECT:   { label: "Direct",    icon: Zap,           accent: "text-emerald-400", group: "tutor",     tagline: "Just the answer" },
  GENERAL:  { label: "Assistant", icon: Bot,           accent: "text-sky-400",     group: "assistant", tagline: "All-purpose AI" },
  CODE:     { label: "Code",      icon: Code2,         accent: "text-green-400",   group: "assistant", tagline: "Write & debug code" },
  WRITE:    { label: "Write",     icon: PenLine,       accent: "text-amber-400",   group: "assistant", tagline: "Essays & content" },
  RESEARCH: { label: "Research",  icon: FlaskConical,  accent: "text-rose-400",    group: "assistant", tagline: "Deep analysis" },
  BUSINESS: { label: "Business",  icon: Briefcase,     accent: "text-orange-400",  group: "assistant", tagline: "Strategy & advice" },
};

const TUTOR_MODES: TutorMode[] = ["LEARN", "PRACTICE", "REVISION", "DIRECT"];
const ASSISTANT_MODES: TutorMode[] = ["GENERAL", "CODE", "WRITE", "RESEARCH", "BUSINESS"];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Session {
  id: string;
  title: string;
  mode: TutorMode;
  updatedAt: string;
  _count?: { messages: number };
}

interface Citation {
  index: number;
  materialId: string;
  filename: string;
  page?: number | null;
  chunkIndex: number;
  excerpt: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface ChatPanelProps {
  courseId?: string;
  courseName?: string;
  onClose: () => void;
}

// ── Markdown renderer (simple, no external dep) ───────────────────────────────

function renderMarkdown(text: string): string {
  return text
    // Code blocks
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="bg-white/5 rounded-lg p-3 text-sm overflow-x-auto my-2 font-mono"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-sm mt-3 mb-1 text-white/90">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-semibold text-base mt-4 mb-1 text-white">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-lg mt-4 mb-2 text-white">$1</h1>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2 my-0.5"><span class="text-white/40 flex-shrink-0 text-xs mt-0.5">•</span><span>$1</span></div>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="mb-2">')
    // Single newlines
    .replace(/\n/g, '<br/>');
}

// ── ChatPanel ─────────────────────────────────────────────────────────────────

export default function ChatPanel({ courseId, courseName, onClose }: ChatPanelProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [mode, setMode] = useState<TutorMode>(courseId ? "LEARN" : "GENERAL");
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showSessions, setShowSessions] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingText, scrollToBottom]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, [courseId]);

  const loadSessions = async () => {
    try {
      const url = courseId
        ? `/api/chat/sessions?courseId=${courseId}`
        : `/api/chat/sessions`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {
      // silent
    }
  };

  const loadSession = async (sessionId: string) => {
    setLoadingSession(true);
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveSessionId(sessionId);
        setMode(data.mode as TutorMode);
        setMessages(
          data.messages
            .filter((m: { role: string }) => m.role !== "SYSTEM")
            .map((m: { id: string; role: string; content: string; createdAt: string }) => ({
              id: m.id,
              role: m.role === "ASSISTANT" ? "assistant" : "user",
              content: m.content,
              createdAt: m.createdAt,
            }))
        );
        setCitations([]);
      }
    } finally {
      setLoadingSession(false);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/chat/sessions/${sessionId}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
      setCitations([]);
    }
  };

  const newChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setCitations([]);
    setStreamingText("");
    setMode(courseId ? "LEARN" : "GENERAL");
    inputRef.current?.focus();
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    // Abort any existing stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const userMsg: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: activeSessionId ?? undefined,
          courseId: courseId ?? undefined,
          mode,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `Error: ${err.error ?? "Something went wrong"}`,
            createdAt: new Date().toISOString(),
          },
        ]);
        setStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let newSessionId = activeSessionId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            // event type handled implicitly via next data line
          } else if (line.startsWith("data: ")) {
            const raw = line.slice(6);
            try {
              const parsed = JSON.parse(raw);

              if (parsed.sessionId && parsed.citations !== undefined) {
                // meta event
                newSessionId = parsed.sessionId;
                setActiveSessionId(parsed.sessionId);
                if (parsed.citations) setCitations(parsed.citations);
              } else if (parsed.text !== undefined) {
                // delta event
                fullText += parsed.text;
                setStreamingText(fullText);
              } else if (parsed.sessionId && !parsed.citations) {
                // done event
                newSessionId = parsed.sessionId;
              } else if (parsed.error) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: `err-${Date.now()}`,
                    role: "assistant",
                    content: `Error: ${parsed.error}`,
                    createdAt: new Date().toISOString(),
                  },
                ]);
              }
            } catch {
              // not JSON, skip
            }
          }
        }
      }

      // Finalize streaming message
      if (fullText) {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: "assistant",
            content: fullText,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      setStreamingText("");

      // Refresh session list to pick up new/updated session + auto-title
      if (newSessionId) {
        setTimeout(() => {
          loadSessions();
        }, 1500);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "Something went wrong. Please try again.",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setStreaming(false);
      setStreamingText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const currentMode = MODES[mode];
  const ModeIcon = currentMode.icon;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[520px] lg:w-[600px] z-50 flex flex-col shadow-2xl">
      {/* Backdrop (mobile) */}
      <div
        className="fixed inset-0 bg-black/50 sm:hidden"
        onClick={onClose}
        style={{ zIndex: -1 }}
      />

      {/* Panel */}
      <div className="flex flex-col h-full bg-[#0f0f1a] border-l border-white/10">
        {/* ── Header ── */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#0f0f1a]">
          <button
            onClick={() => setShowSessions((s) => !s)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
            title="Toggle session list"
          >
            {showSessions ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="font-semibold text-white text-sm flex-1 truncate">
            Splash AI
            {courseName && (
              <span className="text-white/40 font-normal ml-1.5 text-xs">· {courseName}</span>
            )}
          </span>

          <button
            onClick={newChat}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
            title="New chat"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* ── Session sidebar ── */}
          {showSessions && (
            <div className="w-48 flex-shrink-0 border-r border-white/10 flex flex-col bg-[#0a0a14]">
              <div className="p-2 border-b border-white/10">
                <button
                  onClick={newChat}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition text-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New chat
                </button>
              </div>

              {/* Mode picker */}
              <div className="p-2 border-b border-white/10">
                <p className="text-white/30 text-[10px] uppercase tracking-wider px-1 mb-1">Mode</p>
                <div className="space-y-0.5">
                  <p className="text-white/20 text-[10px] uppercase tracking-wider px-1 mt-1">Tutor</p>
                  {TUTOR_MODES.map((m) => {
                    const info = MODES[m];
                    const Icon = info.icon;
                    return (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition text-xs ${
                          mode === m
                            ? "bg-indigo-600/30 text-white"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${mode === m ? info.accent : ""}`} />
                        {info.label}
                      </button>
                    );
                  })}
                  <p className="text-white/20 text-[10px] uppercase tracking-wider px-1 mt-2">Assistant</p>
                  {ASSISTANT_MODES.map((m) => {
                    const info = MODES[m];
                    const Icon = info.icon;
                    return (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition text-xs ${
                          mode === m
                            ? "bg-indigo-600/30 text-white"
                            : "text-white/50 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${mode === m ? info.accent : ""}`} />
                        {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {sessions.length === 0 ? (
                  <p className="text-white/20 text-xs text-center py-4">No chats yet</p>
                ) : (
                  sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => loadSession(s.id)}
                      className={`w-full group flex items-center gap-1.5 px-2 py-2 rounded-lg transition text-left ${
                        activeSessionId === s.id
                          ? "bg-indigo-600/20 text-white"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <MessageSquare className="w-3 h-3 flex-shrink-0 opacity-60" />
                      <span className="flex-1 text-xs truncate">{s.title}</span>
                      <button
                        onClick={(e) => deleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 transition flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Main chat area ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {loadingSession ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
              ) : messages.length === 0 && !streamingText ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
                    <ModeIcon className={`w-6 h-6 ${currentMode.accent}`} />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{currentMode.label} mode</p>
                    <p className="text-white/40 text-xs mt-0.5">{currentMode.tagline}</p>
                  </div>
                  {courseName && (
                    <p className="text-white/30 text-xs mt-1">
                      Ask anything about <span className="text-indigo-400">{courseName}</span>
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-indigo-600 text-white rounded-tr-sm"
                            : "bg-white/8 text-white/90 rounded-tl-sm border border-white/10"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div
                            className="prose-invert"
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                          />
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Streaming bubble */}
                  {streamingText && (
                    <div className="flex gap-3 flex-row">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      </div>
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-white/8 text-white/90 text-sm leading-relaxed border border-white/10">
                        <div
                          className="prose-invert"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingText) }}
                        />
                        <span className="inline-block w-1 h-4 bg-indigo-400 ml-0.5 animate-pulse rounded-sm align-bottom" />
                      </div>
                    </div>
                  )}

                  {/* Thinking indicator */}
                  {streaming && !streamingText && (
                    <div className="flex gap-3 flex-row">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-white/8 border border-white/10 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-indigo-400/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-indigo-400/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-indigo-400/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Citations */}
            {citations.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {citations.slice(0, 4).map((c) => (
                    <div
                      key={c.index}
                      className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg"
                      title={c.excerpt}
                    >
                      <span className="text-indigo-400 text-xs font-mono">[{c.index}]</span>
                      <span className="text-white/50 text-xs truncate max-w-[120px]">{c.filename}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t border-white/10">
              {/* Active mode chip */}
              <div className="flex items-center gap-1.5 mb-2">
                <ModeIcon className={`w-3.5 h-3.5 ${currentMode.accent}`} />
                <span className="text-white/40 text-xs">{currentMode.label}</span>
                {courseId && TUTOR_MODES.includes(mode) && (
                  <span className="text-white/30 text-xs">· grounded in course materials</span>
                )}
              </div>

              <div className="relative flex items-end gap-2 bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 focus-within:border-indigo-500/50 transition">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    courseId
                      ? `Ask about ${courseName ?? "this course"}…`
                      : "Ask anything…"
                  }
                  rows={1}
                  disabled={streaming}
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/30 resize-none outline-none leading-relaxed disabled:opacity-50"
                  style={{ maxHeight: "120px" }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || streaming}
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
                >
                  {streaming ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
              <p className="text-white/20 text-[10px] text-center mt-2">
                Shift+Enter for new line · Enter to send
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
