"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Users, Receipt, ArrowRight, UserPlus, UserMinus, ShieldAlert, BadgeCheck } from "lucide-react";

interface GroupData {
  id: string;
  name: string;
  members: {
    id: string;
    joinDate: string;
    leaveDate: string | null;
    user: { id: string; name: string; email: string };
  }[];
  expenses: {
    id: string;
    description: string;
    amount: number;
    currency: string;
    expenseDate: string;
    splitType: string;
    paidBy: { id: string; name: string };
  }[];
  _count: { expenses: number; settlements: number };
}

interface BalanceData {
  totalExpenses: number;
  memberBalances: {
    userId: string;
    name: string;
    totalPaid: number;
    totalOwed: number;
    netBalance: number;
    expenses: {
      expenseId: string;
      description: string;
      date: string;
      amountINR: number;
      shareAmount: number;
      paidBy: string;
    }[];
  }[];
  settlementSuggestions: {
    fromName: string;
    toName: string;
    amount: number;
    from: string;
    to: string;
  }[];
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [balances, setBalances] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "balances" | "timeline">("overview");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/groups/${id}`).then((r) => r.json()),
      fetch(`/api/groups/${id}/balances`).then((r) => r.json()),
    ])
      .then(([groupData, balanceData]) => {
        setGroup(groupData.group);
        setBalances(balanceData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSettle = async (payerId: string, receiverId: string, amount: number) => {
    setSettling(true);
    try {
      await fetch(`/api/groups/${id}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payerId, receiverId, amount }),
      });
      const balanceData = await fetch(`/api/groups/${id}/balances`).then((r) => r.json());
      setBalances(balanceData);
    } catch (err) {
      console.error(err);
    } finally {
      setSettling(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-12 w-1/3 rounded-xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (!group || !balances) return <div className="text-center py-12 text-muted-foreground">Workspace not found</div>;

  const tabs = [
    { key: "overview", label: "Dashboard" },
    { key: "balances", label: "Net Balances" },
    { key: "timeline", label: "Event Timeline" },
  ] as const;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link href="/groups" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft size={16} className="mr-2" /> Back to Workspaces
          </Link>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {group.name}
          </h1>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex -space-x-3">
              {group.members.slice(0, 5).map((m, i) => (
                <div 
                  key={m.id} 
                  className={`w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold ${m.leaveDate ? 'bg-surface-active text-muted-foreground' : 'bg-accent text-white shadow-[0_0_10px_var(--accent-glow)]'}`}
                  style={{ zIndex: 10 - i }}
                  title={m.user.name}
                >
                  {m.user.name.charAt(0)}
                </div>
              ))}
            </div>
            <span className="text-sm font-medium text-muted-foreground">{group.members.length} Total Members</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/expenses/new"><Button>Record Expense</Button></Link>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-all relative ${
                activeTab === tab.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-surface/50 border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Total Ledger Volume</p>
                  <p className="text-3xl font-bold tracking-tight">{formatCurrency(balances.totalExpenses)}</p>
                </Card>
                <Card className="p-6 bg-surface/50 border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Transaction Count</p>
                  <p className="text-3xl font-bold tracking-tight">{group.expenses.length}</p>
                </Card>
                <Card className="p-6 bg-surface/50 border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Optimization Status</p>
                  <div className="flex items-center gap-2">
                    {balances.settlementSuggestions.length === 0 ? (
                      <BadgeCheck className="text-success" size={24} />
                    ) : (
                      <ShieldAlert className="text-warning" size={24} />
                    )}
                    <p className="text-xl font-bold tracking-tight">
                      {balances.settlementSuggestions.length === 0 ? "Fully Settled" : `${balances.settlementSuggestions.length} Pending`}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Settlement Suggestions */}
              {balances.settlementSuggestions.length > 0 && (
                <Card glowEffect className="border-warning/30 bg-warning/5 overflow-hidden">
                  <div className="p-6 border-b border-warning/20 flex items-center justify-between bg-warning/10">
                    <div>
                      <h3 className="font-semibold text-warning flex items-center gap-2">
                        Optimization Engine Recommendations
                      </h3>
                      <p className="text-sm text-warning/80 mt-1">Execute these transfers to perfectly balance the ledger.</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {balances.settlementSuggestions.map((s, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-surface border border-border gap-4">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">{s.fromName}</span>
                          <ArrowRight size={16} className="text-muted-foreground" />
                          <span className="font-semibold">{s.toName}</span>
                        </div>
                        <div className="flex items-center gap-4 justify-between sm:justify-end">
                          <span className="text-xl font-bold tracking-tight text-accent-light">{formatCurrency(s.amount)}</span>
                          <Button size="sm" onClick={() => handleSettle(s.from, s.to, s.amount)} isLoading={settling}>
                            Execute
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === "balances" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {balances.memberBalances.map((mb) => {
                  const isPositive = mb.netBalance >= 0;
                  const isZero = mb.netBalance === 0;
                  return (
                    <Card key={mb.userId} className="overflow-hidden flex flex-col">
                      <div className="p-6 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isPositive && !isZero ? 'bg-success/20 text-success' : !isPositive ? 'bg-danger/20 text-danger' : 'bg-surface-active text-muted-foreground'}`}>
                            {mb.name.charAt(0)}
                          </div>
                          <h3 className="font-semibold text-lg">{mb.name}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Net Balance</p>
                          <p className={`text-xl font-bold ${isPositive && !isZero ? 'text-success' : !isPositive ? 'text-danger' : 'text-muted-foreground'}`}>
                            {isPositive && !isZero ? '+' : ''}{formatCurrency(mb.netBalance)}
                          </p>
                        </div>
                      </div>
                      <div className="bg-surface-hover p-6 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                          <p className="font-medium">{formatCurrency(mb.totalPaid)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Consumed</p>
                          <p className="font-medium">{formatCurrency(mb.totalOwed)}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-background mt-auto border-t border-border">
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => setSelectedMember(selectedMember === mb.userId ? null : mb.userId)}>
                          {selectedMember === mb.userId ? "Hide Ledger Details" : "View Ledger Details"}
                        </Button>
                      </div>
                      
                      <AnimatePresence>
                        {selectedMember === mb.userId && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-background"
                          >
                            <div className="p-6 border-t border-border max-h-80 overflow-y-auto space-y-3">
                              {mb.expenses.map((exp, i) => (
                                <div key={i} className="flex items-center justify-between text-sm p-3 rounded-lg bg-surface border border-border">
                                  <div>
                                    <p className="font-medium">{exp.description}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(exp.date)} • Paid by {exp.paidBy}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{formatCurrency(exp.amountINR)}</p>
                                    <p className="text-xs text-danger mt-0.5">Share: {formatCurrency(exp.shareAmount)}</p>
                                  </div>
                                </div>
                              ))}
                              {mb.expenses.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No ledger history for this member.</p>}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <Card className="p-8">
              <div className="relative border-l border-border/50 ml-4 space-y-8 pb-4">
                
                {/* Process timeline events */}
                {group.members.slice().sort((a,b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()).map(m => (
                  <div key={`join-${m.id}`} className="relative pl-8">
                    <div className="absolute -left-4 top-1 w-8 h-8 rounded-full bg-success/20 border border-success/30 flex items-center justify-center">
                      <UserPlus size={14} className="text-success" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{m.user.name} joined the workspace</h4>
                      <p className="text-sm text-muted-foreground mt-1">{formatDate(m.joinDate)}</p>
                    </div>
                  </div>
                ))}

                {group.members.filter(m => m.leaveDate).sort((a,b) => new Date(b.leaveDate!).getTime() - new Date(a.leaveDate!).getTime()).map(m => (
                  <div key={`leave-${m.id}`} className="relative pl-8">
                    <div className="absolute -left-4 top-1 w-8 h-8 rounded-full bg-danger/20 border border-danger/30 flex items-center justify-center">
                      <UserMinus size={14} className="text-danger" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{m.user.name} left the workspace</h4>
                      <p className="text-sm text-muted-foreground mt-1">Their balance calculations stopped on {formatDate(m.leaveDate!)}</p>
                    </div>
                  </div>
                ))}

                <div className="relative pl-8">
                  <div className="absolute -left-4 top-1 w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
                    <Users size={14} className="text-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Workspace Created</h4>
                    <p className="text-sm text-muted-foreground mt-1">Platform initialization</p>
                  </div>
                </div>

              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
