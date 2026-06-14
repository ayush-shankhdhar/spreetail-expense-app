"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";

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
    participants: { user: { id: string; name: string }; shareAmount: number }[];
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
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "balances" | "members">("overview");
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
      // Refresh balances
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
      <div>
        <div className="skeleton h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24" />)}
        </div>
        <div className="skeleton h-96" />
      </div>
    );
  }

  if (!group) return <div className="text-center py-12" style={{ color: "var(--muted)" }}>Group not found</div>;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "balances", label: "Balances" },
    { key: "expenses", label: "Expenses" },
    { key: "members", label: "Members" },
  ] as const;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-1">
        <Link href="/groups" className="btn btn-ghost p-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">{group.name}</h1>
      </div>
      <p className="text-sm mb-6 ml-8" style={{ color: "var(--muted)" }}>
        {group.members.length} members • {group._count.expenses} expenses
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: "var(--card)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "gradient-accent text-white shadow-lg"
                : ""
            }`}
            style={activeTab !== tab.key ? { color: "var(--muted)" } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && balances && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="stat-card">
              <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>Total Expenses</p>
              <p className="text-2xl font-bold">{formatCurrency(balances.totalExpenses)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>Active Members</p>
              <p className="text-2xl font-bold">{group.members.filter((m) => !m.leaveDate).length}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>Pending Settlements</p>
              <p className="text-2xl font-bold">{balances.settlementSuggestions.length}</p>
            </div>
          </div>

          {/* Settlement Suggestions */}
          {balances.settlementSuggestions.length > 0 && (
            <div className="glass-card p-5 mb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2">
                  <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
                </svg>
                Settlement Suggestions
              </h3>
              <div className="space-y-3">
                {balances.settlementSuggestions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--card)" }}>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{s.fromName}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                      <span className="font-medium text-sm">{s.toName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold" style={{ color: "var(--accent-light)" }}>{formatCurrency(s.amount)}</span>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSettle(s.from, s.to, s.amount)}
                        disabled={settling}
                      >
                        Settle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Balances Tab */}
      {activeTab === "balances" && balances && (
        <div>
          <div className="glass-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Owed</th>
                  <th className="text-right">Net Balance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {balances.memberBalances.map((mb) => (
                  <tr key={mb.userId}>
                    <td className="font-medium">{mb.name}</td>
                    <td className="text-right">{formatCurrency(mb.totalPaid)}</td>
                    <td className="text-right">{formatCurrency(mb.totalOwed)}</td>
                    <td className="text-right">
                      <span
                        className="font-semibold"
                        style={{ color: mb.netBalance >= 0 ? "var(--success)" : "var(--danger)" }}
                      >
                        {mb.netBalance >= 0 ? "+" : ""}{formatCurrency(mb.netBalance)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setSelectedMember(selectedMember === mb.userId ? null : mb.userId)}
                      >
                        {selectedMember === mb.userId ? "Hide" : "Details"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Expense Breakdown for selected member */}
          {selectedMember && (() => {
            const member = balances.memberBalances.find((mb) => mb.userId === selectedMember);
            if (!member) return null;
            return (
              <div className="glass-card mt-4 p-5 animate-fade-in">
                <h3 className="font-semibold mb-3">
                  Expense Breakdown — {member.name}
                </h3>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                  Every expense that contributes to the balance
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {member.expenses.map((exp, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg text-sm" style={{ background: "var(--card)" }}>
                      <div>
                        <p className="font-medium">{exp.description}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          Paid by {exp.paidBy} • {formatDate(exp.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(exp.amountINR)}</p>
                        <p className="text-xs" style={{ color: "var(--danger)" }}>
                          Share: {formatCurrency(exp.shareAmount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === "expenses" && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <h3 className="font-semibold">All Expenses</h3>
            <Link href="/expenses/new" className="btn btn-primary btn-sm">Add Expense</Link>
          </div>
          {group.expenses.length === 0 ? (
            <div className="empty-state py-12">
              <p style={{ color: "var(--muted)" }}>No expenses in this group</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Paid By</th>
                  <th>Split</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {group.expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="text-sm" style={{ color: "var(--muted)" }}>{formatDate(exp.expenseDate)}</td>
                    <td className="font-medium text-sm">{exp.description}</td>
                    <td className="text-sm">{exp.paidBy.name}</td>
                    <td>
                      <span className="badge badge-muted">{exp.splitType}</span>
                    </td>
                    <td className="text-right font-semibold text-sm">
                      {formatCurrency(decimalToNumber(exp.amount), exp.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Left</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {group.members.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium">{m.user.name}</td>
                  <td className="text-sm" style={{ color: "var(--muted)" }}>{m.user.email}</td>
                  <td className="text-sm">{formatDate(m.joinDate)}</td>
                  <td className="text-sm">{m.leaveDate ? formatDate(m.leaveDate) : "—"}</td>
                  <td>
                    {m.leaveDate ? (
                      <span className="badge badge-danger">Left</span>
                    ) : (
                      <span className="badge badge-success">Active</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
