"use client";

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronDown, Download, FileSpreadsheet, Activity, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

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

  const handleDownload = (session: ImportSession, e: React.MouseEvent) => {
    e.stopPropagation();
    const report = {
      id: session.id,
      filename: session.filename,
      date: session.createdAt,
      stats: {
        totalRows: session.totalRows,
        importedRows: session.imported,
        skippedRows: session.skipped,
      },
      anomalies: session.anomalies.map((a) => ({
        rowNumber: a.rowNumber,
        type: a.anomalyType,
        original: a.originalValue,
        fixed: a.fixedValue,
        action: a.actionTaken,
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-audit-${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-1/4 rounded-xl mb-8" />
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          Complete history of all CSV data ingestion jobs. Review anomalies and download strict JSON audit trails for compliance.
        </p>
      </div>

      {sessions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed border-2 bg-transparent text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
            <FileText size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-2">No audit logs found</h3>
          <p className="text-muted-foreground max-w-sm">
            Import reports will appear here automatically after you process a CSV file through the ingestion engine.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <motion.div key={session.id} variants={itemVariants}>
              <Card 
                hoverEffect 
                className={`overflow-hidden transition-all duration-300 ${expanded === session.id ? 'border-accent/50 shadow-[0_0_20px_var(--accent-glow)]' : ''}`}
              >
                <div 
                  className={`p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${expanded === session.id ? 'bg-surface-hover/30' : ''}`}
                  onClick={() => setExpanded(expanded === session.id ? null : session.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-active border border-border flex items-center justify-center shrink-0 mt-1">
                      <FileSpreadsheet size={18} className="text-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg tracking-tight group-hover:text-accent transition-colors">
                        {session.filename}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {formatDate(session.createdAt)} • ID: {session.id.split('-')[0]}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        <span className="badge badge-muted">
                          {session.totalRows} Processed
                        </span>
                        <span className="badge badge-success">
                          {session.imported} Ingested
                        </span>
                        <span className="badge badge-danger">
                          {session.skipped} Rejected
                        </span>
                        <span className="badge badge-warning">
                          {session.anomalies.length} Flagged
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start md:self-auto ml-14 md:ml-0">
                    <Button variant="outline" size="sm" onClick={(e) => handleDownload(session, e)}>
                      <Download size={14} className="mr-2" /> Audit JSON
                    </Button>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${expanded === session.id ? 'rotate-180 bg-accent/20 text-accent' : 'bg-surface-active text-muted-foreground'}`}>
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expanded === session.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border bg-background/50"
                    >
                      <div className="p-6">
                        <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                          <Activity size={16} className="text-accent" />
                          Detailed Anomaly Trace
                        </h4>

                        {session.anomalies.length === 0 ? (
                          <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm font-medium">
                            <CheckCircle2 size={18} />
                            No anomalies detected. Perfect ingestion.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="data-table w-full">
                              <thead className="bg-surface">
                                <tr>
                                  <th className="w-16">Row</th>
                                  <th>Flag Type</th>
                                  <th>Raw Signature</th>
                                  <th>Engine Resolution</th>
                                  <th>Execution Log</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border/50">
                                {session.anomalies.map((anomaly) => (
                                  <tr key={anomaly.id} className="hover:bg-surface-hover/50 transition-colors">
                                    <td className="p-4 font-mono text-xs text-muted-foreground">#{anomaly.rowNumber}</td>
                                    <td className="p-4">
                                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-warning/10 text-warning border border-warning/20">
                                        <AlertTriangle size={10} />
                                        {anomaly.anomalyType.replace(/_/g, " ")}
                                      </span>
                                    </td>
                                    <td className="p-4">
                                      {anomaly.originalValue ? (
                                        <span className="font-mono text-xs text-danger line-through opacity-80">{anomaly.originalValue}</span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                    <td className="p-4">
                                      {anomaly.fixedValue ? (
                                        <span className="font-mono text-xs text-success">{anomaly.fixedValue}</span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </td>
                                    <td className="p-4 text-sm text-foreground">
                                      {anomaly.actionTaken}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
