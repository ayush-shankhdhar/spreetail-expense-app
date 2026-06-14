"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Activity, Zap, Play } from "lucide-react";

interface AnomalyReport {
  rowNumber: number;
  anomalyType: string;
  originalValue: string | null;
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

// Map severity levels to our fintech design system
const ANOMALY_THEME: Record<string, { color: string; icon: React.FC<any>; label: string; severity: "high" | "medium" | "low" }> = {
  DUPLICATE_EXPENSE: { color: "danger", icon: XCircle, label: "Duplicate Entry", severity: "high" },
  CONFLICTING_DUPLICATE: { color: "danger", icon: XCircle, label: "Data Conflict", severity: "high" },
  MISSING_PAYER: { color: "danger", icon: AlertTriangle, label: "Missing Payer", severity: "high" },
  INVALID_DATE: { color: "danger", icon: AlertTriangle, label: "Invalid Date Format", severity: "high" },
  NEGATIVE_AMOUNT: { color: "warning", icon: AlertTriangle, label: "Refund Detected", severity: "medium" },
  USD_EXPENSE: { color: "warning", icon: Zap, label: "Foreign Currency", severity: "medium" },
  SETTLEMENT_AS_EXPENSE: { color: "warning", icon: Activity, label: "Settlement Routed", severity: "medium" },
  MEMBER_AFTER_LEAVING: { color: "warning", icon: AlertTriangle, label: "Inactive Member", severity: "medium" },
  AMOUNT_FORMAT_FIXED: { color: "info", icon: CheckCircle2, label: "Format Corrected", severity: "low" },
  DATE_FORMAT_FIXED: { color: "info", icon: CheckCircle2, label: "Date Normalized", severity: "low" },
};

function getTheme(type: string) {
  return ANOMALY_THEME[type] || { color: "info", icon: AlertTriangle, label: type.replace(/_/g, " "), severity: "low" };
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  
  // Anomaly review state
  const [reviewedAnomalies, setReviewedAnomalies] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((data) => setGroups(data.groups || []))
      .catch(console.error);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) setFile(droppedFile);
  }, []);

  const handleUpload = async () => {
    if (!file || !selectedGroup) return;
    setUploading(true);
    setError("");
    setReport(null);
    setReviewedAnomalies(new Set());

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("groupId", selectedGroup);

      const res = await fetch("/api/import", { method: "POST", body: formData });
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

  const markReviewed = (index: number) => {
    setReviewedAnomalies(prev => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Ingestion Engine</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
            Upload raw CSV exports. Our anomaly detection engine automatically parses dates, fixes formatting, identifies duplicate settlements, and flags strict conflicts.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!report ? (
          <motion.div 
            key="upload-zone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            {/* Configuration */}
            <Card className="p-1 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="bg-surface rounded-[10px] p-6 relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Target Workspace</h3>
                  <p className="text-xs text-muted-foreground">Select the ledger destination for the imported data.</p>
                </div>
                <div className="w-full md:w-72">
                  <select
                    className="input w-full bg-background"
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                  >
                    <option value="">Select a workspace...</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>
            </Card>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("csv-input")?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
                dragOver ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-accent/50 hover:bg-surface-hover"
              } ${file ? "border-success/50 bg-success/5" : ""}`}
            >
              <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              
              <div className="relative z-10 flex flex-col items-center">
                <motion.div 
                  animate={dragOver ? { y: -10 } : { y: 0 }} 
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${file ? 'bg-success-glow' : 'bg-surface border border-border'}`}
                >
                  {file ? (
                    <FileSpreadsheet size={36} className="text-success" />
                  ) : (
                    <UploadCloud size={36} className={dragOver ? "text-accent" : "text-muted-foreground"} />
                  )}
                </motion.div>
                
                {file ? (
                  <>
                    <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">{file.name}</h3>
                    <p className="text-sm font-medium text-success bg-success/10 px-3 py-1 rounded-full">Ready for ingestion</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold tracking-tight mb-2">Drag & Drop CSV File</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                      Support for standard expense exports. The engine will automatically map columns and detect anomalies.
                    </p>
                  </>
                )}
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium flex items-center gap-3">
                <AlertTriangle size={18} /> {error}
              </motion.div>
            )}

            <div className="flex justify-end">
              <Button 
                size="lg" 
                disabled={!file || !selectedGroup || uploading} 
                isLoading={uploading}
                onClick={handleUpload}
                className="w-full md:w-auto relative group overflow-hidden"
              >
                {!uploading && (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                )}
                {!uploading && <Play size={18} className="mr-2" />}
                {uploading ? "Analyzing Dataset..." : "Run Ingestion Engine"}
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Report & Anomaly Center */
          <motion.div 
            key="report-zone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Health Overview Widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Rows", value: report.totalRows, color: "text-foreground", border: "border-border" },
                { label: "Successfully Ingested", value: report.importedRows, color: "text-success", border: "border-success/30", bg: "bg-success/5" },
                { label: "Skipped / Failed", value: report.skippedRows, color: "text-danger", border: "border-danger/30", bg: "bg-danger/5" },
                { label: "Anomalies Detected", value: report.anomalies.length, color: "text-warning", border: "border-warning/30", bg: "bg-warning/5" },
              ].map((stat, i) => (
                <Card key={i} className={`p-5 flex flex-col justify-between border ${stat.border} ${stat.bg || ''}`}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className={`text-3xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
                </Card>
              ))}
            </div>

            {/* Anomaly Review Center */}
            {report.anomalies.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Anomaly Review Center</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {reviewedAnomalies.size} of {report.anomalies.length} anomalies reviewed
                    </p>
                  </div>
                  <div className="w-48 h-2 bg-surface rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-accent" 
                      initial={{ width: 0 }}
                      animate={{ width: `${(reviewedAnomalies.size / report.anomalies.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {report.anomalies.map((anomaly, index) => {
                    const theme = getTheme(anomaly.anomalyType);
                    const isReviewed = reviewedAnomalies.has(index);
                    
                    return (
                      <motion.div 
                        key={index}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`p-0 h-full flex flex-col border-2 transition-all duration-300 ${isReviewed ? 'border-border opacity-60' : `border-${theme.color}/30 shadow-[0_0_15px_var(--${theme.color}-glow)]`}`}>
                          {/* Header */}
                          <div className={`p-4 border-b border-border bg-${theme.color}/5 flex items-start justify-between`}>
                            <div className="flex items-center gap-2">
                              <theme.icon size={18} className={`text-${theme.color}`} />
                              <span className="font-semibold text-sm">{theme.label}</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground bg-background px-2 py-1 rounded">Row {anomaly.rowNumber}</span>
                          </div>
                          
                          {/* Body */}
                          <div className="p-4 flex-1 flex flex-col justify-center">
                            <p className="text-sm leading-relaxed mb-4">{anomaly.actionTaken}</p>
                            
                            {(anomaly.originalValue || anomaly.fixedValue) && (
                              <div className="bg-surface-hover rounded-lg p-3 text-xs font-mono space-y-2 mt-auto">
                                {anomaly.originalValue && (
                                  <div className="flex gap-2">
                                    <span className="text-muted-foreground w-12 shrink-0">Raw:</span>
                                    <span className="text-danger truncate line-through opacity-80">{anomaly.originalValue}</span>
                                  </div>
                                )}
                                {anomaly.fixedValue && (
                                  <div className="flex gap-2">
                                    <span className="text-muted-foreground w-12 shrink-0">Fixed:</span>
                                    <span className="text-success truncate font-medium">{anomaly.fixedValue}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Action Footer */}
                          {!isReviewed && (
                            <div className="p-3 border-t border-border grid grid-cols-2 gap-2 bg-background/50">
                              <Button size="sm" variant="outline" onClick={() => markReviewed(index)}>Dismiss</Button>
                              <Button size="sm" onClick={() => markReviewed(index)}>Acknowledge</Button>
                            </div>
                          )}
                          {isReviewed && (
                            <div className="p-3 border-t border-border bg-success/5 text-success text-xs font-medium flex items-center justify-center gap-2">
                              <CheckCircle2 size={14} /> Reviewed
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-6 border-t border-border">
              <Button variant="secondary" onClick={() => setReport(null)}>Process Another Dataset</Button>
              <Button>Download Detailed JSON Audit</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
