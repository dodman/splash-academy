"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  Plus,
  Trash2,
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
  ChevronLeft,
  ChevronRight,
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

// ── Markdown renderer ─────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="bg-white/5 rounded-lg p-3 text-sm overflow-x-auto my-2 font-mono border border-white/10"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="font-semibold text-sm mt-3 mb-1 text-white/90">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-semibold text-base mt-4 mb-1 text-white">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-lg mt-4 mb-2 text-white">$1</h1>')
    .replace(/^\d+\. (.+)$/gm, '<div class="flex gap-2 my-0.5"><span class="text-white/40 flex-shrink-0 text-xs mt-1">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>');
}

const STARTER_PROMPTS: Partial<Record<TutorMode, string[]>> = {
  GENERAL: [
    "Explain quantum computing simply",
    "What is opportunity cost?",
    "Help me understand machine learning",
    "Brainstorm 10 ideas for my project",
  ],
  CODE: [
    "Debug this Python error",
    "Write a REST API in Node.js",
    "Explain async/await in JavaScript",
    "How does a hash map work?",
  ],
  WRITE: [
    "Write an essay introduction",
    "Help me structure my dissertation",
    "Write a professional email",
    "Rewrite this paragraph clearly",
  ],
  RESEARCH: [
    "Analyse causes of World War I",
    "Compare Keynesian vs Austrian economics",
    "Evaluate this argument critically",
    "Break down the scientific method",
  ],
  BUSINESS: [
    "Help me write a business plan",
    "SWOT analysis for a startup idea",
    "Explain Porter's Five Forces",
    "What makes a good pitch deck?",
  ],
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AiPageClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<TutorMode>("GENERAL");
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, streamingText, scrollToBottom]);

  useEffect(() => {
    loadSessions();
    inputRef.current?.focus();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) setSessions(await res.json());
    } catch {}
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
    }
  };

  const newChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setStreamingText("");
    setMode("GENERAL");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setMessages((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, role: "user", content: msg, createdAt: new Date().toISOString() },
    ]);
    setInput("");
    setStreaming(true);
    setStreamingText("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId: activeSessionId ?? undefined, mode }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: "assistant", content: `Error: ${err.error ?? "Something went wrong"}`, createdAt: new Date().toISOString() }]);
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
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.sessionId && parsed.citations !== undefined) {
                newSessionId = parsed.sessionId;
                setActiveSessionId(parsed.sessionId);
              } else if (parsed.text !== undefined) {
                fullText += parsed.text;
                setStreamingText(fullText);
              } else if (parsed.error) {
                setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: "assistant", content: `Error: ${parsed.error}`, createdAt: new Date().toISOString() }]);
              }
            } catch {}
          }
        }
      }

      if (fullText) {
        setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: "assistant", content: fullText, createdAt: new Date().toISOString() }]);
      }
      setStreamingText("");

      if (newSessionId) {
        setTimeout(() => loadSessions(), 1500);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: "assistant", content: "Something went wrong. Please try again.", createdAt: new Date().toISOString() }]);
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
  const starters = STARTER_PROMPTS[mode] ?? [];
  const isEmpty = messages.length === 0 && !streamingText;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#0f0f1a] overflow-hidden">
      {/* ── Left Sidebar ── */}
      <div
        className={`flex-shrink-0 flex flex-col transition-all duration-300 border-r border-white/10 bg-[#0a0a14] ${
          sidebarOpen ? "w-60" : "w-12"
        }`}
      >
        {sidebarOpen ? (
          <>
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-white font-semibold text-sm">Splash AI</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-white/30 hover:text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* New chat */}
            <div className="px-3 py-2 border-b border-white/10">
              <button
                onClick={newChat}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition text-sm"
              >
                <Plus className="w-4 h-4" />
                New chat
              </button>
            </div>

            {/* Mode picker */}
            <div className="px-3 py-2 border-b border-white/10 overflow-y-auto flex-shrink-0">
              <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1">Tutor modes</p>
              {TUTOR_MODES.map((m) => {
                const info = MODES[m];
                const Icon = info.icon;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition text-xs mb-0.5 ${
                      mode === m ? "bg-indigo-600/30 text-white" : "text-white/45 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${mode === m ? info.accent : ""}`} />
                    <span className="truncate">{info.label}</span>
                    {mode === m && <span className="ml-auto text-white/30 text-[10px] truncate">{info.tagline}</span>}
                  </button>
                );
              })}
              <p className="text-white/25 text-[10px] uppercase tracking-wider mt-2 mb-1">AI assistant</p>
              {ASSISTANT_MODES.map((m) => {
                const info = MODES[m];
                const Icon = info.icon;
                return (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition text-xs mb-0.5 ${
                      mode === m ? "bg-indigo-600/30 text-white" : "text-white/45 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${mode === m ? info.accent : ""}`} />
                    <span className="truncate">{info.label}</span>
                    {mode === m && <span className="ml-auto text-white/30 text-[10px] truncate">{info.tagline}</span>}
                  </button>
                );
              })}
            </div>

            {/* Sessions */}
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <p className="text-white/25 text-[10px] uppercase tracking-wider mb-1">Recent chats</p>
              {sessions.length === 0 ? (
                <p className="text-white/20 text-xs text-center py-4">No chats yet</p>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => loadSession(s.id)}
                    className={`w-full group flex items-center gap-2 px-2 py-2 rounded-lg transition text-left mb-0.5 ${
                      activeSessionId === s.id
                        ? "bg-indigo-600/20 text-white"
                        : "text-white/45 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <MessageSquare className="w-3 h-3 flex-shrink-0 opacity-50" />
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
          </>
        ) : (
          /* Collapsed sidebar */
          <div className="flex flex-col items-center py-3 gap-2">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-white/30 hover:text-white transition">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={newChat} className="p-2 text-white/30 hover:text-white transition" title="New chat">
              <Plus className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10" />
            {[...TUTOR_MODES, ...ASSISTANT_MODES].map((m) => {
              const Icon = MODES[m].icon;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`p-1.5 rounded-lg transition ${mode === m ? "text-white bg-indigo-600/30" : "text-white/25 hover:text-white"}`}
                  title={MODES[m].label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-white/10">
          <ModeIcon className={`w-5 h-5 ${currentMode.accent}`} />
          <div>
            <p className="text-white font-medium text-sm">{currentMode.label}</p>
            <p className="text-white/40 text-xs">{currentMode.tagline}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {loadingSession ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
                <ModeIcon className={`w-8 h-8 ${currentMode.accent}`} />
              </div>
              <div>
                <h2 className="text-white text-xl font-semibold">{currentMode.label} mode</h2>
                <p className="text-white/50 mt-1">{currentMode.tagline}</p>
              </div>
              {starters.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                  {starters.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/20 transition text-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 max-w-3xl mx-auto w-full ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-white/5 text-white/90 rounded-tl-sm border border-white/10"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming bubble */}
              {streamingText && (
                <div className="flex gap-4 max-w-3xl mx-auto w-full flex-row">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 bg-white/5 text-white/90 text-sm leading-relaxed border border-white/10">
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingText) }} />
                    <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse rounded-sm align-bottom" />
                  </div>
                </div>
              )}

              {/* Thinking dots */}
              {streaming && !streamingText && (
                <div className="flex gap-4 max-w-3xl mx-auto w-full flex-row">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white/5 border border-white/10 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-indigo-400/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-indigo-400/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-indigo-400/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-4 sm:px-8 pb-6 pt-2 border-t border-white/10">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-3 bg-white/5 border border-white/15 rounded-2xl px-4 py-3 focus-within:border-indigo-500/50 transition">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${currentMode.label}…`}
                rows={1}
                disabled={streaming}
                className="flex-1 bg-transparent text-white text-sm placeholder-white/30 resize-none outline-none leading-relaxed disabled:opacity-50"
                style={{ maxHeight: "150px" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || streaming}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
              >
                {streaming ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
            <p className="text-white/20 text-[11px] text-center mt-2">
              Shift+Enter for new line · Enter to send
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
