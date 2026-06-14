"use client";

import { useState, useEffect, useCallback } from "react";

interface AnomalyReport {
  rowNumber: number;
  anomalyType: string;
  originalValue: string;
  fixedValue: string | null;
  actionTaken: string;
}

interface ImportReport {
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  settlementsDetected: number;
  anomalies: AnomalyReport[];
  importSessionId: string;
}

interface Group {
  id: string;
  name: string;
}

const ANOMALY_COLORS: Record<string, string> = {
  DUPLICATE_EXPENSE: "danger",
  CONFLICTING_DUPLICATE: "danger",
  MISSING_PAYER: "danger",
  MISSING_AMOUNT: "danger",
  MISSING_DESCRIPTION: "danger",
  ZERO_AMOUNT: "danger",
  INVALID_DATE: "danger",
  NEGATIVE_AMOUNT: "warning",
  EXCESS_DECIMAL_PRECISION: "info",
  MISSING_CURRENCY: "info",
  AMOUNT_FORMAT_FIXED: "info",
  DATE_FORMAT_FIXED: "info",
  NAME_VARIATION: "info",
  AMBIGUOUS_DATE: "warning",
  USD_EXPENSE: "warning",
  SETTLEMENT_AS_EXPENSE: "warning",
  MEMBER_AFTER_LEAVING: "warning",
  MEMBER_BEFORE_JOINING: "warning",
  INVALID_PARTICIPANT: "warning",
  SPLIT_TYPE_MISMATCH: "info",
  INVALID_PERCENTAGES: "warning",
  MISSING_SPLIT_TYPE: "info",
};

function getAnomalyColor(type: string): string {
  return ANOMALY_COLORS[type] || "info";
}

function getAnomalyIcon(color: string) {
  if (color === "danger") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  }
  if (color === "warning") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((data) => {
        setGroups(data.groups || []);
      })
      .catch(console.error);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) {
      setFile(droppedFile);
    }
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });
      const data = await res.json();
      if (res.ok) {
        setGroups((prev) => [...prev, data.group]);
        setSelectedGroup(data.group.id);
        setNewGroupName("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedGroup) return;
    setUploading(true);
    setError("");
    setReport(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("groupId", selectedGroup);

      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }

      setReport(data.report);
    } catch {
      setError("Import failed — please try again");
    } finally {
      setUploading(false);
    }
  };

  const anomalyTypes = report
    ? [...new Set(report.anomalies.map((a) => a.anomalyType))]
    : [];

  const filteredAnomalies = report?.anomalies.filter(
    (a) => activeFilter === "all" || a.anomalyType === activeFilter
  ) || [];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Import CSV</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Upload your expense CSV to import data with anomaly detection
        </p>
      </div>

      {!report ? (
        <div className="max-w-2xl">
          {/* Group Selection */}
          <div className="glass-card p-6 mb-4">
            <h3 className="font-semibold mb-3">1. Select or Create Group</h3>
            <div className="flex gap-3">
              <select
                className="input flex-1"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="">Select a group...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <span className="text-sm self-center" style={{ color: "var(--muted)" }}>or</span>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="New group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  style={{ width: "180px" }}
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCreateGroup}
                  disabled={creatingGroup || !newGroupName.trim()}
                >
                  {creatingGroup ? "..." : "Create"}
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="glass-card p-6 mb-4">
            <h3 className="font-semibold mb-3">2. Upload CSV File</h3>
            <div
              className={`file-drop-zone ${dragOver ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("csv-input")?.click()}
            >
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" className="mx-auto mb-3">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                    {(file.size / 1024).toFixed(1)} KB • Click to change
                  </p>
                </div>
              ) : (
                <div>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" className="mx-auto mb-3">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="font-medium">Drop your CSV file here</p>
                  <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                    or click to browse
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--danger-glow)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary btn-lg w-full"
            onClick={handleUpload}
            disabled={!file || !selectedGroup || uploading}
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing CSV...
              </span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Import & Analyze
              </>
            )}
          </button>
        </div>
      ) : (
        /* Import Report */
        <div>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="stat-card">
              <p className="text-xs" style={{ color: "var(--muted)" }}>Total Rows</p>
              <p className="text-2xl font-bold">{report.totalRows}</p>
            </div>
            <div className="stat-card" style={{ borderColor: "var(--success)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Imported</p>
              <p className="text-2xl font-bold" style={{ color: "var(--success)" }}>{report.importedRows}</p>
            </div>
            <div className="stat-card" style={{ borderColor: "var(--danger)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Skipped</p>
              <p className="text-2xl font-bold" style={{ color: "var(--danger)" }}>{report.skippedRows}</p>
            </div>
            <div className="stat-card" style={{ borderColor: "var(--warning)" }}>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Anomalies</p>
              <p className="text-2xl font-bold" style={{ color: "var(--warning)" }}>{report.anomalies.length}</p>
            </div>
          </div>

          {report.settlementsDetected > 0 && (
            <div className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2" style={{ background: "var(--info-glow)", color: "var(--info)", border: "1px solid var(--info)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              {report.settlementsDetected} settlement(s) detected and imported as payment records (not expenses)
            </div>
          )}

          {/* Anomaly Filter Tabs */}
          <div className="glass-card p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold">Anomalies Detected</h3>
              <span className="badge badge-warning">{report.anomalies.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  activeFilter === "all" ? "border-[var(--accent)]" : "border-[var(--border)]"
                }`}
                style={activeFilter === "all" ? { background: "var(--accent-glow)", color: "var(--accent-light)" } : { color: "var(--muted)" }}
              >
                All ({report.anomalies.length})
              </button>
              {anomalyTypes.map((type) => {
                const count = report.anomalies.filter((a) => a.anomalyType === type).length;
                const color = getAnomalyColor(type);
                return (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      activeFilter === type ? `border-[var(--${color})]` : "border-[var(--border)]"
                    }`}
                    style={activeFilter === type
                      ? { background: `var(--${color}-glow)`, color: `var(--${color})` }
                      : { color: "var(--muted)" }
                    }
                  >
                    {type.replace(/_/g, " ")} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anomaly List */}
          <div className="space-y-2 mb-6">
            {filteredAnomalies.map((anomaly, i) => {
              const color = getAnomalyColor(anomaly.anomalyType);
              return (
                <div key={i} className={`anomaly-card ${color === "danger" ? "error" : color === "info" ? "fixed" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getAnomalyIcon(color)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: `var(--${color}-glow)`, color: `var(--${color})` }}>
                          Row {anomaly.rowNumber}
                        </span>
                        <span className={`badge badge-${color}`}>
                          {anomaly.anomalyType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm">{anomaly.actionTaken}</p>
                      {anomaly.originalValue && (
                        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                          Original: <code className="px-1 py-0.5 rounded" style={{ background: "var(--card)" }}>{anomaly.originalValue}</code>
                        </p>
                      )}
                      {anomaly.fixedValue && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--success)" }}>
                          Fixed to: <code className="px-1 py-0.5 rounded" style={{ background: "var(--card)" }}>{anomaly.fixedValue}</code>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setReport(null);
                setFile(null);
              }}
            >
              Import Another File
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `import-report-${report.importSessionId}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Report JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
