"use client";

/**
 * /gpa/ask-ai — Optional AI advisor.
 * Sends the user's GPA snapshot + question to Splash AI; receives
 * { answer, recommendations }. Splash AI does NOT recalculate GPA —
 * it only explains and advises based on the numbers we send it.
 */

import { useState } from "react";

interface AiAdvice {
  answer: string;
  recommendations: string[];
}

const SUGGESTIONS = [
  "Can I still get distinction?",
  "What grades do I need next semester?",
  "Which courses are pulling my GPA down?",
  "Create a study plan based on my weak courses",
];

export default function AskAiPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<AiAdvice | null>(null);
  const [error, setError] = useState("");

  const ask = async () => {
    if (!question.trim()) return;
    setError("");
    setAdvice(null);
    setLoading(true);
    try {
      const res = await fetch("/api/gpa/ask-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || d.message || "AI request failed");
      }
      setAdvice(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h2>Ask Splash AI about my GPA</h2>
      <p className="muted" style={{ marginBottom: 12 }}>
        Get personal academic advice based on your actual courses and grades.
        AI explains and advises only — it never recalculates your GPA.
      </p>

      <div className="auth-page" style={{ padding: 0, margin: 0 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            rows={4}
            required
            style={{ resize: "vertical", minHeight: 90 }}
          />
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              margin: "-4px 0 4px",
            }}
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuestion(s)}
                className="btn btn-ghost"
                style={{
                  fontSize: "0.78rem",
                  padding: "6px 10px",
                  fontWeight: 400,
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <button type="submit" className="btn" disabled={loading || !question.trim()}>
            {loading ? "Thinking..." : "Get advice"}
          </button>
        </form>
      </div>

      {error && <p className="error" style={{ marginTop: 14 }}>{error}</p>}

      {advice && (
        <>
          <div className="year-card" style={{ marginTop: 18 }}>
            <h3 style={{ color: "#1a1a2e", marginBottom: 8 }}>
              Splash AI says
            </h3>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55, fontSize: "0.95rem" }}>
              {advice.answer}
            </p>
          </div>
          {advice.recommendations.length > 0 && (
            <div className="year-card">
              <h3 style={{ color: "#1a1a2e", marginBottom: 8 }}>Recommendations</h3>
              <ol style={{ paddingLeft: 20 }}>
                {advice.recommendations.map((r, i) => (
                  <li key={i} style={{ marginBottom: 6, fontSize: "0.95rem" }}>
                    {r}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}
