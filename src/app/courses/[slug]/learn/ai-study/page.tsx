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

type Tab = "materials" | "ask" | "quizzes";

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
            Upload materials, ask questions, and generate quizzes powered by Splash AI
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
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const fetchSaved = useCallback(async () => {
    setLoadingSaved(true);
    const res = await fetch(`/api/courses/${slug}/quizzes`);
    if (res.ok) setSavedQuizzes(await res.json());
    setLoadingSaved(false);
  }, [slug]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setQuiz(null);
    setRevealed(new Set());
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
      setQuiz(data.quiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (i: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const difficultyColors: Record<string, string> = {
    easy: "text-green-600 bg-green-50",
    medium: "text-amber-600 bg-amber-50",
    hard: "text-red-600 bg-red-50",
  };

  const [savedViewIndex, setSavedViewIndex] = useState<number | null>(null);
  const [savedRevealed, setSavedRevealed] = useState<Set<number>>(new Set());

  return (
    <div className="space-y-6">
      {/* Generate Form */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-semibold mb-4">Generate a Quiz</h2>

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
              Base quiz on uploaded materials
            </span>
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
              "Generate Quiz"
            )}
          </button>
        </form>
      </div>

      {/* Generated Quiz */}
      {quiz && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 bg-primary/5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <span className="font-semibold">Generated Quiz</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[difficulty]}`}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRevealed(new Set(quiz.map((_, i) => i)))}
                className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition"
              >
                Show all answers
              </button>
              <button
                onClick={() => setRevealed(new Set())}
                className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition"
              >
                Hide all
              </button>
            </div>
          </div>

          <div className="divide-y divide-border">
            {quiz.map((q, i) => (
              <div key={i} className="px-6 py-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-7 h-7 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="font-medium leading-relaxed">{q.question}</p>
                </div>

                {/* Options for MCQ / True-False */}
                {q.options && (
                  <div className="ml-10 grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {q.options.map((opt, j) => (
                      <div
                        key={j}
                        className={`px-4 py-2.5 rounded-lg text-sm border transition ${
                          revealed.has(i) && opt === q.correctAnswer
                            ? "bg-green-50 border-green-400 text-green-800 font-medium"
                            : "border-border"
                        }`}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reveal button */}
                <div className="ml-10">
                  <button
                    onClick={() => toggleReveal(i)}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    {revealed.has(i) ? "Hide answer" : "Show answer"}
                  </button>

                  {revealed.has(i) && (
                    <div className="mt-3 space-y-2">
                      {!q.options && (
                        <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl">
                          <strong>Answer:</strong> {q.correctAnswer}
                        </div>
                      )}
                      <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-xl">
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            ) : savedViewIndex === null ? (
              <div className="divide-y divide-border">
                {savedQuizzes.map((sq, i) => (
                  <div
                    key={sq.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer transition"
                    onClick={() => {
                      setSavedViewIndex(i);
                      setSavedRevealed(new Set());
                    }}
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {sq.topic ?? "General quiz"} —{" "}
                        <span className="text-muted-foreground">
                          {(sq.questions as QuizQuestion[]).length} questions
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sq.difficulty} &middot; {sq.questionType} &middot;{" "}
                        {new Date(sq.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setSavedViewIndex(null)}
                  className="mx-6 mt-4 text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to list
                </button>
                <div className="divide-y divide-border mt-2">
                  {(savedQuizzes[savedViewIndex].questions as QuizQuestion[]).map((q, i) => (
                    <div key={i} className="px-6 py-5">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="w-7 h-7 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <p className="font-medium leading-relaxed">{q.question}</p>
                      </div>
                      {q.options && (
                        <div className="ml-10 grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {q.options.map((opt, j) => (
                            <div
                              key={j}
                              className={`px-4 py-2.5 rounded-lg text-sm border ${
                                savedRevealed.has(i) && opt === q.correctAnswer
                                  ? "bg-green-50 border-green-400 text-green-800 font-medium"
                                  : "border-border"
                              }`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="ml-10">
                        <button
                          onClick={() =>
                            setSavedRevealed((prev) => {
                              const next = new Set(prev);
                              next.has(i) ? next.delete(i) : next.add(i);
                              return next;
                            })
                          }
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          {savedRevealed.has(i) ? "Hide answer" : "Show answer"}
                        </button>
                        {savedRevealed.has(i) && (
                          <div className="mt-3 space-y-2">
                            {!q.options && (
                              <div className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-xl">
                                <strong>Answer:</strong> {q.correctAnswer}
                              </div>
                            )}
                            <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-xl">
                              <strong>Explanation:</strong> {q.explanation}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

