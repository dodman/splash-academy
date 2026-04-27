/**
 * RicoGPA module layout.
 * Wraps every /gpa/* page with the original RicoGPA visual identity:
 *   - Light grey background  (#f5f7fa)
 *   - Dark navy sub-navbar   (#1a1a2e)
 *   - Royal blue accent      (#4361ee)
 *   - Centered max-width-900 content
 *
 * The Splash Academy top navbar (purple) stays above this — that's where
 * the user's session/logout lives. This layout supplies a RICOGPA wordmark
 * + dashboard/add/courses/forecast/ask-ai sub-nav.
 */

import Link from "next/link";
import GpaSubNav from "@/components/gpa/SubNav";

export default function GpaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rico-root min-h-[calc(100vh-4rem)]">
      {/* Sub-navbar — RicoGPA dark navy */}
      <nav className="rico-nav">
        <Link href="/gpa" className="rico-brand">
          RICOGPA
        </Link>
        <GpaSubNav />
      </nav>

      <div className="rico-container">{children}</div>

      {/* Page-scoped CSS — only affects /gpa/* */}
      <style>{`
        .rico-root {
          background: #f5f7fa;
          color: #1a1a2e;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .rico-nav {
          background: #1a1a2e;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 56px;
        }
        .rico-brand {
          font-size: 1.3rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: 1px;
          text-decoration: none;
        }
        .rico-brand:hover { text-decoration: none; }
        .rico-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 24px 16px;
        }
        .rico-root h2 { margin: 16px 0; font-size: 1.5rem; font-weight: 700; }
        .rico-root h3 { font-size: 1rem; font-weight: 600; color: #555; }
        .rico-root .big-number {
          font-size: 2.4rem;
          font-weight: 700;
          color: #1a1a2e;
          line-height: 1.1;
          margin: 6px 0;
        }
        .rico-root .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin: 16px 0 28px;
        }
        .rico-root .card {
          background: #fff;
          border: 1px solid #e6e8ee;
          border-radius: 8px;
          padding: 18px 20px;
        }
        .rico-root .badge {
          display: inline-block;
          background: #4361ee;
          color: #fff;
          font-size: 0.75rem;
          padding: 3px 10px;
          border-radius: 999px;
          font-weight: 500;
          margin-top: 6px;
        }
        .rico-root .year-card {
          background: #fff;
          border: 1px solid #e6e8ee;
          border-radius: 8px;
          padding: 16px 20px;
          margin-bottom: 18px;
        }
        .rico-root .year-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 12px;
        }
        .rico-root .year-header h3 { color: #1a1a2e; font-size: 1.05rem; }
        .rico-root .year-stats {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 0.9rem;
        }
        .rico-root .year-gpa strong { color: #4361ee; }
        .rico-root .year-credits { color: #666; }
        .rico-root table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.92rem;
        }
        .rico-root th, .rico-root td {
          padding: 10px 8px;
          text-align: left;
          border-bottom: 1px solid #eef0f4;
        }
        .rico-root th {
          font-weight: 600;
          color: #555;
          background: #fafbfd;
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .rico-root tbody tr:hover { background: #fafbfd; }
        .rico-root tbody tr:last-child td { border-bottom: 0; }
        .rico-root .auth-page { max-width: 480px; margin: 16px auto; }
        .rico-root .auth-page form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #fff;
          padding: 20px;
          border: 1px solid #e6e8ee;
          border-radius: 8px;
        }
        .rico-root label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #555;
          margin-bottom: -6px;
        }
        .rico-root input,
        .rico-root select,
        .rico-root textarea {
          padding: 10px 12px;
          border: 1px solid #d8dce3;
          border-radius: 6px;
          font-size: 1rem;
          width: 100%;
          background: #fff;
          color: #1a1a2e;
          font-family: inherit;
        }
        .rico-root input:focus,
        .rico-root select:focus,
        .rico-root textarea:focus {
          outline: none;
          border-color: #4361ee;
        }
        .rico-root .btn {
          background: #4361ee;
          color: #fff;
          border: 0;
          border-radius: 6px;
          padding: 10px 16px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .rico-root .btn:hover { opacity: 0.9; }
        .rico-root .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .rico-root .btn-ghost {
          background: transparent;
          color: #4361ee;
          border: 1px solid #d8dce3;
        }
        .rico-root .btn-ghost:hover { background: #eef1fb; }
        .rico-root .btn-danger {
          background: transparent;
          color: #c0392b;
          border: 1px solid #f1c4be;
        }
        .rico-root .btn-danger:hover { background: #fdecea; }
        .rico-root .error {
          background: #fdecea;
          color: #c0392b;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.9rem;
        }
        .rico-root .success {
          background: #e6f6ec;
          color: #1f7a3d;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.9rem;
        }
        .rico-root .loading {
          text-align: center;
          padding: 48px;
          color: #666;
        }
        .rico-root .muted { color: #666; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
