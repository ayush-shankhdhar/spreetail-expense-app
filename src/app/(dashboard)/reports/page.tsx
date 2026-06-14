"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";

interface ImportSession {
  id: string;
  filename: string;
  totalRows: number;
  imported: number;
  skipped: number;
  createdAt: string;
  anomalies: {
    id: string;
    rowNumber: number;
    anomalyType: string;
    originalValue: string | null;
    fixedValue: string | null;
    actionTaken: string;
  }[];
}

export default function ReportsPage() {
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/import")
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Import Reports</h1>
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="skeleton h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Import Reports</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          History of CSV imports and their anomaly reports
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-state glass-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
          <p className="text-lg font-medium mt-4">No import reports</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Import a CSV file to generate your first report</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="glass-card overflow-hidden">
              <button
                className="w-full p-5 flex items-center justify-between text-left"
                onClick={() => setExpanded(expanded === session.id ? null : session.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{session.filename}</h3>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {formatDate(session.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-muted">{session.totalRows} rows</span>
                    <span className="badge badge-success">{session.imported} imported</span>
                    <span className="badge badge-danger">{session.skipped} skipped</span>
                    <span className="badge badge-warning">{session.anomalies.length} anomalies</span>
                  </div>
                </div>
                <svg
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2"
                  style={{ transform: expanded === session.id ? "rotate(180deg)" : "", transition: "transform 0.2s" }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expanded === session.id && (
                <div className="border-t px-5 pb-5" style={{ borderColor: "var(--border)" }}>
                  <div className="mt-4 flex justify-between items-center mb-3">
                    <h4 className="font-medium text-sm">Anomaly Details</h4>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        const report = {
                          totalRows: session.totalRows,
                          importedRows: session.imported,
                          skippedRows: session.skipped,
                          anomalies: session.anomalies.map((a) => ({
                            rowNumber: a.rowNumber,
                            anomalyType: a.anomalyType,
                            originalValue: a.originalValue,
                            fixedValue: a.fixedValue,
                            actionTaken: a.actionTaken,
                          })),
                        };
                        const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `import-report-${session.id}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download JSON
                    </button>
                  </div>

                  {session.anomalies.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>No anomalies detected — clean import!</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Row</th>
                            <th>Type</th>
                            <th>Original</th>
                            <th>Fixed</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {session.anomalies.map((anomaly) => (
                            <tr key={anomaly.id}>
                              <td className="font-mono text-sm">{anomaly.rowNumber}</td>
                              <td>
                                <span className="badge badge-warning text-xs">
                                  {anomaly.anomalyType.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="text-sm max-w-48 truncate" style={{ color: "var(--muted)" }}>
                                {anomaly.originalValue || "—"}
                              </td>
                              <td className="text-sm max-w-48 truncate" style={{ color: "var(--success)" }}>
                                {anomaly.fixedValue || "—"}
                              </td>
                              <td className="text-sm max-w-64">{anomaly.actionTaken}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
