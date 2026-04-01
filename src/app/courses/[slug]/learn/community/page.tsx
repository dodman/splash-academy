"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface UserInfo {
  id: string;
  name: string;
  avatar: string | null;
}

interface Answer {
  id: string;
  body: string;
  createdAt: string;
  user: UserInfo;
}

interface Question {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  user: UserInfo;
  answers: Answer[];
}

interface Discussion {
  id: string;
  body: string;
  createdAt: string;
  user: UserInfo;
}

type CommunityTab = "students" | "questions" | "discussion";

export default function CommunityPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [tab, setTab] = useState<CommunityTab>("students");
  const [students, setStudents] = useState<UserInfo[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  const [qTitle, setQTitle] = useState("");
  const [qBody, setQBody] = useState("");
  const [submittingQ, setSubmittingQ] = useState(false);

  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [submittingA, setSubmittingA] = useState<string | null>(null);

  const [dBody, setDBody] = useState("");
  const [submittingD, setSubmittingD] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/courses/${slug}/students`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/courses/${slug}/questions`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/courses/${slug}/discussions`).then((r) => (r.ok ? r.json() : [])),
    ]).then(([s, q, d]) => {
      setStudents(s);
      setQuestions(q);
      setDiscussions(d);
      setLoading(false);
    });
  }, [slug]);

  const submitQuestion = async () => {
    if (!qTitle.trim() || !qBody.trim()) return;
    setSubmittingQ(true);
    const res = await fetch(`/api/courses/${slug}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: qTitle, body: qBody }),
    });
    if (res.ok) {
      const q = await res.json();
      setQuestions((prev) => [q, ...prev]);
      setQTitle("");
      setQBody("");
    }
    setSubmittingQ(false);
  };

  const submitAnswer = async (questionId: string) => {
    const text = answerText[questionId];
    if (!text?.trim()) return;
    setSubmittingA(questionId);
    const res = await fetch(`/api/courses/${slug}/questions/${questionId}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (res.ok) {
      const a = await res.json();
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, answers: [...q.answers, a] } : q
        )
      );
      setAnswerText((prev) => ({ ...prev, [questionId]: "" }));
    }
    setSubmittingA(null);
  };

  const submitDiscussion = async () => {
    if (!dBody.trim()) return;
    setSubmittingD(true);
    const res = await fetch(`/api/courses/${slug}/discussions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: dBody }),
    });
    if (res.ok) {
      const d = await res.json();
      setDiscussions((prev) => [...prev, d]);
      setDBody("");
    }
    setSubmittingD(false);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const Avatar = ({ user }: { user: UserInfo }) => (
    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-primary">
          {user.name?.[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );

  const tabItems: { key: CommunityTab; label: string; count: number }[] = [
    { key: "students", label: "Students", count: students.length },
    { key: "questions", label: "Q&A", count: questions.length },
    { key: "discussion", label: "Discussion", count: discussions.length },
  ];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-40 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/courses/${slug}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to course
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Course Community</h1>

      <div className="flex gap-1 border-b border-border mb-6">
        {tabItems.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Students Tab */}
      {tab === "students" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {students.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 p-4 border border-border rounded-xl">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                {s.avatar ? (
                  <img src={s.avatar} alt={s.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-primary">
                    {s.name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-center">{s.name}</p>
            </div>
          ))}
          {students.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">
              No students enrolled yet.
            </p>
          )}
        </div>
      )}

      {/* Q&A Tab */}
      {tab === "questions" && (
        <div className="space-y-6">
          <div className="border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm">Ask a Question</h3>
            <input
              type="text"
              value={qTitle}
              onChange={(e) => setQTitle(e.target.value)}
              placeholder="Question title"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <textarea
              value={qBody}
              onChange={(e) => setQBody(e.target.value)}
              placeholder="Describe your question..."
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <button
              onClick={submitQuestion}
              disabled={submittingQ || !qTitle.trim() || !qBody.trim()}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
            >
              {submittingQ ? "Posting..." : "Post Question"}
            </button>
          </div>

          {questions.map((q) => (
            <div key={q.id} className="border border-border rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar user={q.user} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{q.user.name}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(q.createdAt)}</span>
                    </div>
                    <h3 className="font-semibold mt-1">{q.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{q.body}</p>
                  </div>
                </div>
              </div>

              {q.answers.length > 0 && (
                <div className="border-t border-border bg-muted/30">
                  {q.answers.map((a) => (
                    <div key={a.id} className="px-4 py-3 border-b border-border last:border-0">
                      <div className="flex items-start gap-3 ml-6">
                        <Avatar user={a.user} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{a.user.name}</span>
                            <span className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                          </div>
                          <p className="text-sm mt-1">{a.body}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-4 border-t border-border bg-muted/10">
                <div className="flex gap-2 ml-6">
                  <input
                    type="text"
                    value={answerText[q.id] || ""}
                    onChange={(e) => setAnswerText((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Write an answer..."
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onKeyDown={(e) => e.key === "Enter" && submitAnswer(q.id)}
                  />
                  <button
                    onClick={() => submitAnswer(q.id)}
                    disabled={submittingA === q.id || !answerText[q.id]?.trim()}
                    className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}

          {questions.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No questions yet. Be the first to ask!
            </p>
          )}
        </div>
      )}

      {/* Discussion Tab */}
      {tab === "discussion" && (
        <div className="space-y-4">
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="max-h-96 overflow-y-auto p-4 space-y-4">
              {discussions.map((d) => (
                <div key={d.id} className="flex items-start gap-3">
                  <Avatar user={d.user} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{d.user.name}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(d.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-0.5">{d.body}</p>
                  </div>
                </div>
              ))}
              {discussions.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </p>
              )}
            </div>

            <div className="border-t border-border p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={dBody}
                  onChange={(e) => setDBody(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onKeyDown={(e) => e.key === "Enter" && submitDiscussion()}
                />
                <button
                  onClick={submitDiscussion}
                  disabled={submittingD || !dBody.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition disabled:opacity-50"
                >
                  {submittingD ? "..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
