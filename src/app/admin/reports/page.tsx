"use client";

import { useState, useEffect } from "react";

interface Report {
  id: string;
  subject: string;
  message: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "OPEN" | "REVIEWED" | "RESOLVED">("all");

  const fetchReports = () => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchReports(); }, []);

  const updateReport = async (reportId: string, status: string, adminNote?: string) => {
    await fetch(`/api/admin/reports/${reportId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(adminNote !== undefined && { adminNote }) }),
    });
    fetchReports();
    window.dispatchEvent(new Event("admin-notifications-refresh"));
  };

  const statusColors: Record<string, string> = {
    OPEN: "bg-red-100 text-red-700",
    REVIEWED: "bg-yellow-100 text-yellow-700",
    RESOLVED: "bg-green-100 text-green-700",
  };

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);
  const openCount = reports.filter((r) => r.status === "OPEN").length;

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold">User Reports</h1>
      <p className="text-muted-foreground mt-1">{reports.length} total reports &middot; {openCount} open</p>

      <div className="mt-4 flex gap-2">
        {(["all", "OPEN", "REVIEWED", "RESOLVED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
              filter === f ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No reports found.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((report) => (
            <div key={report.id} className="border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{report.subject}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[report.status] || ""}`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    By {report.user.name} ({report.user.email}) &middot;{" "}
                    {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                  {report.adminNote && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <span className="font-medium">Admin note:</span> {report.adminNote}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {report.status === "OPEN" && (
                    <button
                      onClick={() => updateReport(report.id, "REVIEWED")}
                      className="text-xs px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
                    >
                      Mark Reviewed
                    </button>
                  )}
                  {report.status !== "RESOLVED" && (
                    <button
                      onClick={() => updateReport(report.id, "RESOLVED")}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
