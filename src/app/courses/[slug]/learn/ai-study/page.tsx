"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ─── Types ──────────────────────────────────────────

interface Material {
  id: string;
  title: string;
  filename: string;
  fileType: string;
  createdAt: string;
  user: { name: string };
}

interface QuizQuestion {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface SavedQuiz {
  id: string;
  topic: string | null;
  difficulty: string;
  questionType: string;
  questions: QuizQuestion[];
  createdAt: string;
  user: { name: string };
}

type Tab = "materials" | "ask" | "quizzes" | "summaries";

// ─── Page ───────────────────────────────────────────

export default function AiStudyPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tab, setTab] = useState<Tab>("materials");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  const fetchMaterials = useCallback(async () => {
    const res = await fetch(`/api/courses/${slug}/materials`);
    if (res.ok) setMaterials(await res.json());
    setLoadingMaterials(false);
  }, [slug]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    {
      key: "materials",
      label: "Course Materials",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      key: "ask",
      label: "Ask Splash AI",
      icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
    },
    {
      key: "quizzes",
      label: "Generate Quiz",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    },
    {
      key: "summaries",
      label: "Summaries",
      icon: "M4 6h16M4 12h16M4 18h7",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/courses/${slug}`}
          className="text-muted-foreground hover:text-foreground transition text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to course
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">✨</span> AI Study Assistant
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload materials, ask questions, generate quizzes, and get smart summaries powered by Splash AI
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center ${
              tab === t.key
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "materials" && (
        <MaterialsTab
          slug={slug}
          materials={materials}
          loading={loadingMaterials}
          onUploaded={fetchMaterials}
        />
      )}
      {tab === "ask" && (
        <AskAiTab slug={slug} materials={materials} />
      )}
      {tab === "quizzes" && (
        <QuizzesTab slug={slug} materials={materials} />
      )}
      {tab === "summaries" && (
        <SummariesTab slug={slug} materials={materials} />
      )}
    </div>
  );
}

// ─── Materials Tab ───────────────────────────────────

function MaterialsTab({
  slug,
  materials,
  loading,
  onUploaded,
}: {
  slug: string;
  materials: Material[];
  loading: boolean;
  onUploaded: () => void;
}) {
  const [uploadMode, setUploadMode] = useState<"file" | "text">("file");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUploading(true);

    try {
      let res: Response;

      if (uploadMode === "file") {
        if (!file) throw new Error("Please select a file");
        const form = new FormData();
        form.append("file", file);
        if (title) form.append("title", title);
        res = await fetch(`/api/courses/${slug}/materials`, {
          method: "POST",
          body: form,
        });
      } else {
        if (!content.trim()) throw new Error("Please paste some content");
        res = await fetch(`/api/courses/${slug}/materials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title || "Pasted notes", content }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      setSuccess("Material uploaded and processed!");
      setTitle("");
      setContent("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const fileTypeIcon: Record<string, string> = {
    pdf: "📄",
    docx: "📝",
    txt: "📃",
    text: "📋",
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-semibold mb-4">Upload Study Material</h2>

        {/* Mode selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setUploadMode("file")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              uploadMode === "file"
                ? "bg-primary text-white"
                : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setUploadMode("text")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              uploadMode === "text"
                ? "bg-primary text-white"
                : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            Paste Text
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Title <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 1 Lecture Notes"
              className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>

          {uploadMode === "file" ? (
            <div>
              <label className="block text-sm font-medium mb-1">File</label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-3xl mb-2">📁</div>
                  <p className="text-sm font-medium">
                    {file ? file.name : "Click to select a file"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, DOCX, TXT — max 10 MB
                  </p>
                </label>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your lecture notes, textbook excerpts, or any study content here..."
                rows={8}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {content.length.toLocaleString()} / 60,000 characters
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </>
            ) : (
              "Upload Material"
            )}
          </button>
        </form>
      </div>

      {/* Materials List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold">Uploaded Materials</h2>
          <span className="text-sm text-muted-foreground">
            {materials.length} item{materials.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-muted-foreground animate-pulse">
            Loading...
          </div>
        ) : materials.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted-foreground">
            <div className="text-4xl mb-3">📚</div>
            <p className="font-medium">No materials yet</p>
            <p className="text-sm mt-1">Upload your first material above</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {materials.map((m) => (
              <div key={m.id} className="px-6 py-4 flex items-center gap-4">
                <span className="text-2xl flex-shrink-0">
                  {fileTypeIcon[m.fileType] ?? "📄"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.filename} &middot; uploaded by {m.user.name} &middot;{" "}
                    {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded uppercase">
                  {m.fileType}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Ask AI Tab ──────────────────────────────────────

function AskAiTab({
  slug,
  materials,
}: {
  slug: string;
  materials: Material[];
}) {
  const [question, setQuestion] = useState("");
  const [useMaterials, setUseMaterials] = useState(true);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<{
    answer: string;
    sourceUsed: boolean;
    message: string;
    citations?: { materialId?: string; title?: string; filename?: string }[];
  } | null>(null);
  const [error, setError] = useState("");

  const handleAsk = async () => {
    if (!question.trim()) return;
    setError("");
    setAnswer(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/courses/${slug}/ask-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          materialIds: useMaterials ? materials.map((m) => m.id) : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI request failed");
      }

      setAnswer(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Explain this topic in simple terms",
    "Give me examples from real life",
    "What are the key points I should know?",
    "Summarise the main concepts",
    "What questions might appear in an exam?",
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl">
            ✨
          </div>
          <div>
            <h2 className="font-semibold">Ask Splash AI</h2>
            <p className="text-sm text-muted-foreground">
              Ask any question about your course
            </p>
          </div>
        </div>

        {materials.length > 0 && (
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <div
              onClick={() => setUseMaterials(!useMaterials)}
              className={`w-12 h-6 rounded-full transition-colors ${useMaterials ? "bg-primary" : "bg-muted"} relative flex-shrink-0`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${useMaterials ? "left-7" : "left-1"}`}
              />
            </div>
            <span className="text-sm">
              Answer based on{" "}
              <strong>{materials.length} uploaded material{materials.length !== 1 ? "s" : ""}</strong>
            </span>
          </label>
        )}

        {materials.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-4">
            No materials uploaded yet — AI will answer from general knowledge. Upload materials for course-specific answers.
          </div>
        )}

        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question here... e.g. What is entrepreneurship?"
          rows={4}
          className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none text-sm mb-3"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAsk();
          }}
        />

        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-2 mb-4">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setQuestion(s)}
              className="text-xs px-3 py-1.5 border border-border rounded-full hover:bg-muted transition"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Splash AI is thinking...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Ask AI
            </>
          )}
        </button>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Ctrl+Enter to send
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-4 rounded-xl">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Answer */}
      {answer && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 bg-primary/5 border-b border-border flex items-center gap-2">
            <span className="text-lg">✨</span>
            <span className="font-semibold text-primary">Splash AI Response</span>
            {answer.sourceUsed && (
              <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Used course materials
              </span>
            )}
          </div>
          <div className="px-6 py-5">
            <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
              {answer.answer}
            </div>

            {/* Citations */}
            {answer.citations && answer.citations.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Sources used:</p>
                <div className="flex flex-wrap gap-2">
                  {answer.citations.map((c, i) => (
                    <span
                      key={i}
                      className="text-xs bg-primary/5 text-primary border border-primary/20 px-2 py-0.5 rounded-full"
                    >
                      {c.title || c.filename || "Material"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-3">
              {answer.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quizzes Tab ─────────────────────────────────────

// ─── Interactive Quiz Player ─────────────────────────

interface ActiveQuiz {
  questions: QuizQuestion[];
  topic?: string | null;
  difficulty: string;
  questionType: string;
}

function QuizPlayer({
  quiz,
  onBack,
}: {
  quiz: ActiveQuiz;
  onBack: () => void;
}) {
  const { questions, topic, difficulty, questionType } = quiz;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);

  const current = questions[currentIdx];
  const isSubmitted = submitted.has(currentIdx);
  const chosenAnswer = selected[currentIdx];
  const isCorrect = chosenAnswer === current.correctAnswer;
  const isShortAnswer = questionType === "short-answer" || !current.options;

  const score = questions.filter(
    (q, i) => submitted.has(i) && selected[i] === q.correctAnswer
  ).length;

  const progressPct = ((currentIdx + 1) / questions.length) * 100;

  const difficultyBadge: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    hard: "bg-red-100 text-red-700",
  };

  const handleSelect = (opt: string) => {
    if (isSubmitted) return;
    setSelected((prev) => ({ ...prev, [currentIdx]: opt }));
  };

  const handleSubmit = () => {
    if (!isShortAnswer && !chosenAnswer) return;
    setSubmitted((prev) => new Set([...prev, currentIdx]));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setDone(true);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx((i) => i - 1);
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelected({});
    setSubmitted(new Set());
    setDone(false);
  };

  // ── Results screen ──────────────────────────────────
  if (done) {
    const total = isShortAnswer ? questions.length : questions.length;
    const pct = isShortAnswer ? null : Math.round((score / total) * 100);
    const grade =
      pct === null
        ? null
        : pct >= 80
        ? { label: "Excellent!", color: "text-green-600", emoji: "🎉" }
        : pct >= 60
        ? { label: "Good job!", color: "text-amber-600", emoji: "👍" }
        : { label: "Keep practising", color: "text-red-600", emoji: "📚" };

    return (
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-5 bg-primary/5 border-b border-border flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold">Quiz complete</span>
        </div>

        <div className="px-6 py-10 text-center">
          {grade ? (
            <>
              <div className="text-5xl mb-3">{grade.emoji}</div>
              <p className={`text-3xl font-bold mb-1 ${grade.color}`}>{pct}%</p>
              <p className="text-lg font-semibold mb-1">{grade.label}</p>
              <p className="text-muted-foreground text-sm mb-8">
                You got {score} out of {total} questions correct
              </p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-3">✅</div>
              <p className="text-lg font-semibold mb-1">Quiz complete</p>
              <p className="text-muted-foreground text-sm mb-8">
                Review the answers below and check your self-assessment
              </p>
            </>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition"
            >
              Try again
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 border border-border rounded-xl font-medium hover:bg-muted transition"
            >
              Back to generator
            </button>
          </div>
        </div>

        {/* Answer review */}
        <div className="border-t border-border divide-y divide-border">
          {questions.map((q, i) => {
            const userAns = selected[i];
            const correct = userAns === q.correctAnswer;
            return (
              <div key={i} className="px-6 py-4">
                <div className="flex items-start gap-3 mb-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                      isShortAnswer
                        ? "bg-muted text-muted-foreground"
                        : correct
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isShortAnswer ? i + 1 : correct ? "✓" : "✗"}
                  </span>
                  <p className="text-sm font-medium leading-relaxed">{q.question}</p>
                </div>
                <div className="ml-9 space-y-1 text-xs">
                  {!isShortAnswer && userAns && userAns !== q.correctAnswer && (
                    <p className="text-red-600">Your answer: {userAns}</p>
                  )}
                  <p className="text-green-700 font-medium">
                    {isShortAnswer ? "Answer: " : "Correct: "}
                    {q.correctAnswer}
                  </p>
                  <p className="text-muted-foreground leading-relaxed pt-1">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Active question ─────────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Exit quiz
          </button>
          <div className="flex items-center gap-2">
            {topic && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {topic}
              </span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                difficultyBadge[difficulty] ?? "bg-muted text-muted-foreground"
              }`}
            >
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
            {!isShortAnswer && (
              <span className="text-xs text-muted-foreground">
                {score} / {submitted.size} correct
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {currentIdx + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="px-6 py-6">
        <p className="text-base font-semibold leading-relaxed mb-5">{current.question}</p>

        {/* Options (MCQ / True-False) */}
        {current.options && (
          <div className="space-y-2.5">
            {current.options.map((opt) => {
              const isSelected = chosenAnswer === opt;
              const isAnswer = opt === current.correctAnswer;

              let optClass =
                "w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all flex items-center gap-3 ";

              if (!isSubmitted) {
                optClass += isSelected
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border hover:border-primary/50 hover:bg-muted/40";
              } else {
                if (isAnswer) {
                  optClass += "border-green-400 bg-green-50 text-green-800 font-medium";
                } else if (isSelected && !isAnswer) {
                  optClass += "border-red-400 bg-red-50 text-red-800";
                } else {
                  optClass += "border-border text-muted-foreground";
                }
              }

              return (
                <button key={opt} className={optClass} onClick={() => handleSelect(opt)}>
                  {/* Radio indicator */}
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      isSubmitted && isAnswer
                        ? "border-green-500 bg-green-500"
                        : isSubmitted && isSelected && !isAnswer
                        ? "border-red-500 bg-red-500"
                        : isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {isSubmitted && isAnswer && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isSubmitted && isSelected && !isAnswer && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {!isSubmitted && isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    )}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {/* Short answer — just show the answer after submit */}
        {isShortAnswer && (
          <div className="bg-muted/40 rounded-xl px-4 py-3 text-sm text-muted-foreground italic">
            Short answer — check your response against the model answer below.
          </div>
        )}

        {/* Feedback after submit */}
        {isSubmitted && (
          <div className="mt-4 space-y-2">
            {!isShortAnswer && (
              <div
                className={`flex items-center gap-2 text-sm font-semibold ${
                  isCorrect ? "text-green-700" : "text-red-700"
                }`}
              >
                {isCorrect ? (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Correct!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Incorrect — correct answer: {current.correctAnswer}
                  </>
                )}
              </div>
            )}
            {isShortAnswer && (
              <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl">
                <strong>Model answer:</strong> {current.correctAnswer}
              </div>
            )}
            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-xl leading-relaxed">
              <strong>Explanation:</strong> {current.explanation}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        {!isSubmitted ? (
          <button
            onClick={isShortAnswer ? handleSubmit : handleSubmit}
            disabled={!isShortAnswer && !chosenAnswer}
            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isShortAnswer ? "Reveal answer" : "Submit"}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition"
          >
            {currentIdx < questions.length - 1 ? "Next" : "See results"}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Quizzes Tab ─────────────────────────────────────

function QuizzesTab({
  slug,
  materials,
}: {
  slug: string;
  materials: Material[];
}) {
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [questionType, setQuestionType] = useState("multiple-choice");
  const [useMaterials, setUseMaterials] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null);

  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const fetchSaved = useCallback(async () => {
    setLoadingSaved(true);
    const res = await fetch(`/api/courses/${slug}/quizzes`);
    if (res.ok) setSavedQuizzes(await res.json());
    setLoadingSaved(false);
  }, [slug]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setActiveQuiz(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/courses/${slug}/generate-quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic || undefined,
          numberOfQuestions: numQuestions,
          difficulty,
          questionType,
          materialIds: useMaterials ? materials.map((m) => m.id) : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Quiz generation failed");
      }

      const data = await res.json();
      setActiveQuiz({
        questions: data.quiz,
        topic: topic || null,
        difficulty,
        questionType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Show the interactive player when a quiz is active
  if (activeQuiz) {
    return (
      <QuizPlayer
        quiz={activeQuiz}
        onBack={() => setActiveQuiz(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Generate Form */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl">
            🎯
          </div>
          <div>
            <h2 className="font-semibold">Generate a Quiz</h2>
            <p className="text-sm text-muted-foreground">
              AI-generated questions from your uploaded materials
            </p>
          </div>
        </div>

        {materials.length > 0 && (
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <div
              onClick={() => setUseMaterials(!useMaterials)}
              className={`w-12 h-6 rounded-full transition-colors ${useMaterials ? "bg-primary" : "bg-muted"} relative flex-shrink-0`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${useMaterials ? "left-7" : "left-1"}`}
              />
            </div>
            <span className="text-sm">Base quiz on uploaded materials</span>
          </label>
        )}

        {materials.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-4">
            No materials uploaded — quiz will be generated from general knowledge about the course topic.
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Topic <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Supply and Demand, Unit 3, Chapter 5..."
              className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Questions</label>
              <select
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition bg-white"
              >
                {[3, 5, 8, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition bg-white"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition bg-white"
              >
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True / False</option>
                <option value="short-answer">Short Answer</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating quiz...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Quiz
              </>
            )}
          </button>
        </form>
      </div>

      {/* Past Quizzes */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Past Quizzes</h3>
          <button
            onClick={() => {
              if (!showSaved) fetchSaved();
              setShowSaved((v) => !v);
            }}
            className="text-sm text-primary hover:underline"
          >
            {showSaved ? "Hide" : "View history"}
          </button>
        </div>

        {showSaved && (
          <>
            {loadingSaved ? (
              <div className="px-6 py-8 text-center text-muted-foreground animate-pulse">Loading...</div>
            ) : savedQuizzes.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground">No saved quizzes yet</div>
            ) : (
              <div className="divide-y divide-border">
                {savedQuizzes.map((sq) => (
                  <div
                    key={sq.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer transition group"
                    onClick={() =>
                      setActiveQuiz({
                        questions: sq.questions as QuizQuestion[],
                        topic: sq.topic,
                        difficulty: sq.difficulty,
                        questionType: sq.questionType,
                      })
                    }
                  >
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition">
                        {sq.topic ?? "General quiz"}{" "}
                        <span className="text-muted-foreground font-normal">
                          — {(sq.questions as QuizQuestion[]).length} questions
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {sq.difficulty} &middot; {sq.questionType} &middot;{" "}
                        {new Date(sq.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition">
                        Play
                      </span>
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Summaries Tab ───────────────────────────────────

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  possibleExamQuestions: string[];
}

function SummariesTab({
  slug,
  materials,
}: {
  slug: string;
  materials: Material[];
}) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("all");
  const [summaryType, setSummaryType] = useState<"short" | "detailed" | "revision-notes">("short");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [generatedFor, setGeneratedFor] = useState<{ label: string; type: string } | null>(null);

  const summaryTypeLabels: Record<string, string> = {
    short: "Quick Overview",
    detailed: "Detailed Breakdown",
    "revision-notes": "Revision Notes",
  };

  const summaryTypeDescriptions: Record<string, string> = {
    short: "150–250 word executive summary of the material",
    detailed: "Thorough section-by-section breakdown of all concepts",
    "revision-notes": "Bullet-point exam-ready notes with key facts and definitions",
  };

  const handleGenerate = async () => {
    if (materials.length === 0) return;
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/courses/${slug}/summarize-material`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: selectedMaterialId === "all" ? undefined : selectedMaterialId,
          summaryType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Summary generation failed");
      }

      const data = await res.json();
      setResult(data);

      const selectedLabel =
        selectedMaterialId === "all"
          ? `All ${materials.length} materials`
          : materials.find((m) => m.id === selectedMaterialId)?.title ?? "Selected material";

      setGeneratedFor({ label: selectedLabel, type: summaryTypeLabels[summaryType] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (materials.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-12 text-center text-muted-foreground">
        <div className="text-4xl mb-3">📄</div>
        <p className="font-medium">No materials uploaded yet</p>
        <p className="text-sm mt-1">
          Upload materials in the{" "}
          <button
            className="text-primary hover:underline"
            onClick={() => {
              /* parent controls tab; user can click Course Materials tab */
            }}
          >
            Course Materials
          </button>{" "}
          tab first, then come back here to generate summaries.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Config panel */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl">
            📋
          </div>
          <div>
            <h2 className="font-semibold">Summarise Material</h2>
            <p className="text-sm text-muted-foreground">
              Let Splash AI create study-ready notes from your uploaded materials
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Material selector */}
          <div>
            <label className="block text-sm font-medium mb-1">Material to summarise</label>
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition bg-white"
            >
              <option value="all">All materials ({materials.length})</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Summary type */}
          <div>
            <label className="block text-sm font-medium mb-2">Summary style</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(["short", "detailed", "revision-notes"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSummaryType(type)}
                  className={`p-3 rounded-xl border text-left transition ${
                    summaryType === type
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <p className="text-sm font-medium">{summaryTypeLabels[type]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {summaryTypeDescriptions[type]}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Splash AI is summarising...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Generate Summary
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && generatedFor && (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 bg-primary/5 border-b border-border flex items-center gap-2 flex-wrap">
              <span className="text-lg">📋</span>
              <span className="font-semibold text-primary">{generatedFor.type}</span>
              <span className="text-xs text-muted-foreground">—</span>
              <span className="text-xs text-muted-foreground">{generatedFor.label}</span>
            </div>

            {/* Summary */}
            <div className="px-6 py-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Summary
              </h3>
              <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
                {result.summary}
              </div>
            </div>
          </div>

          {/* Key Points */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="text-primary">🔑</span> Key Points
              </h3>
            </div>
            <ul className="px-6 py-4 space-y-2">
              {result.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Possible Exam Questions */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="text-amber-500">🎓</span> Possible Exam Questions
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Questions Splash AI thinks could appear in an assessment based on this material
              </p>
            </div>
            <ul className="px-6 py-4 space-y-3">
              {result.possibleExamQuestions.map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-amber-500 flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span className="text-sm leading-relaxed">{q}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
