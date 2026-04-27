"use client";

/**
 * /gpa/forecast — RicoGPA's forecast tool.
 * Pick a target classification + remaining credits → AI tells you what
 * grade you need on average to reach it.
 */

import { useState } from "react";

interface ForecastResult {
  currentGPA: number;
  totalCredits: number;
  targetLabel: string;
  targetGPA: number;
  remainingCredits: number;
  neededGPA: number;
  advice: string;
}

const TARGETS = [
  { value: "distinction", label: "Distinction (≥ 3.75)" },
  { value: "merit", label: "Meritorious (≥ 3.25)" },
  { value: "credit", label: "Credit (≥ 2.68)" },
  { value: "pass", label: "Pass" },
];

export default function ForecastPage() {
  const [target, setTarget] = useState("distinction");
  const [remaining, setRemaining] = useState("60");
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/gpa/forecast?target=${target}&remainingCredits=${remaining}`
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || d.error || "Forecast failed");
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Forecast failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h2>Forecast</h2>
      <p className="muted" style={{ marginBottom: 12 }}>
        Predict the GPA you need on remaining credits to reach a target
        classification.
      </p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={run}>
        <label htmlFor="target">Target classification</label>
        <select
          id="target"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        >
          {TARGETS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <label htmlFor="remaining">Remaining credit hours</label>
        <input
          id="remaining"
          type="number"
          min={1}
          value={remaining}
          onChange={(e) => setRemaining(e.target.value)}
          required
        />

        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Calculating..." : "Calculate Forecast"}
        </button>
      </form>

      {result && (
        <div className="year-card" style={{ marginTop: 18 }}>
          <h3 style={{ color: "#1a1a2e", marginBottom: 10 }}>Forecast Result</h3>
          <table>
            <tbody>
              <tr>
                <td className="muted">Current GPA</td>
                <td>
                  <strong>{result.currentGPA.toFixed(2)}</strong>
                </td>
              </tr>
              <tr>
                <td className="muted">Total credits so far</td>
                <td>{result.totalCredits}</td>
              </tr>
              <tr>
                <td className="muted">Target</td>
                <td>
                  {result.targetLabel} ({result.targetGPA})
                </td>
              </tr>
              <tr>
                <td className="muted">Remaining credits</td>
                <td>{result.remainingCredits}</td>
              </tr>
              <tr>
                <td className="muted">Needed average GPA</td>
                <td>
                  <strong
                    style={{
                      color:
                        result.neededGPA <= 0
                          ? "#1f7a3d"
                          : result.neededGPA > 5
                          ? "#c0392b"
                          : "#4361ee",
                    }}
                  >
                    {result.neededGPA <= 0 ? "Already achieved" : result.neededGPA}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
          <p
            style={{
              marginTop: 12,
              padding: "10px 12px",
              background:
                result.neededGPA <= 0
                  ? "#e6f6ec"
                  : result.neededGPA > 5
                  ? "#fdecea"
                  : "#eef1fb",
              color:
                result.neededGPA <= 0
                  ? "#1f7a3d"
                  : result.neededGPA > 5
                  ? "#c0392b"
                  : "#1a1a2e",
              borderRadius: 6,
              fontSize: "0.92rem",
            }}
          >
            {result.advice}
          </p>
        </div>
      )}
    </div>
  );
}
