"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  _count: { expenses: number };
  members: { user: { id: string; name: string } }[];
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: string;
  paidBy: { name: string };
  group: { name: string };
}

interface Settlement {
  id: string;
  amount: number;
  date: string;
  payer: { name: string };
  receiver: { name: string };
  group: { name: string };
}

export default function DashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/groups").then((r) => r.json()),
      fetch("/api/expenses").then((r) => r.json()),
      fetch("/api/settlements").then((r) => r.json()),
    ])
      .then(([groupsData, expensesData, settlementsData]) => {
        setGroups(groupsData.groups || []);
        setExpenses((expensesData.expenses || []).slice(0, 10));
        setSettlements(settlementsData.settlements || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + decimalToNumber(e.amount),
    0
  );
  const totalMembers = new Set(
    groups.flatMap((g) => g.members.map((m) => m.user.id))
  ).size;

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
        <div className="skeleton h-64" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Overview of your shared expenses
          </p>
        </div>
        <Link href="/expenses/new" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Expense
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-glow)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Total Expenses</p>
              <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--success-glow)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Groups</p>
              <p className="text-xl font-bold">{groups.length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--info-glow)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--info)" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><path d="M20 8v6" /><path d="M23 11h-6" />
              </svg>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Members</p>
              <p className="text-xl font-bold">{totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--warning-glow)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2">
                <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
              </svg>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>Settlements</p>
              <p className="text-xl font-bold">{settlements.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold">Recent Expenses</h2>
            <Link href="/expenses" className="text-xs font-medium" style={{ color: "var(--accent-light)" }}>
              View all →
            </Link>
          </div>
          {expenses.length === 0 ? (
            <div className="empty-state py-12">
              <p style={{ color: "var(--muted)" }}>No expenses yet</p>
              <Link href="/import" className="btn btn-primary btn-sm mt-4">
                Import CSV
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-[var(--card-hover)] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{expense.description}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {expense.paidBy.name} • {formatDate(expense.expenseDate)}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-semibold">
                      {formatCurrency(decimalToNumber(expense.amount), expense.currency)}
                    </p>
                    <span className={`badge ${expense.currency === "USD" ? "badge-warning" : "badge-muted"}`}>
                      {expense.currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Groups */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold">Your Groups</h2>
            <Link href="/groups" className="text-xs font-medium" style={{ color: "var(--accent-light)" }}>
              View all →
            </Link>
          </div>
          {groups.length === 0 ? (
            <div className="empty-state py-12">
              <p style={{ color: "var(--muted)" }}>No groups yet</p>
              <Link href="/groups" className="btn btn-primary btn-sm mt-4">
                Create Group
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="p-4 flex items-center justify-between hover:bg-[var(--card-hover)] transition-colors block"
                >
                  <div>
                    <p className="text-sm font-medium">{group.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {group.members.length} members • {group._count.expenses} expenses
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/import" className="stat-card flex items-center gap-4 hover:border-[var(--accent)]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center gradient-accent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm">Import CSV</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Upload expense data</p>
          </div>
        </Link>

        <Link href="/expenses/new" className="stat-card flex items-center gap-4 hover:border-[var(--accent)]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--success)", opacity: 0.9 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm">Add Expense</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Record a new expense</p>
          </div>
        </Link>

        <Link href="/reports" className="stat-card flex items-center gap-4 hover:border-[var(--accent)]">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--info)", opacity: 0.9 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-sm">View Reports</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Import history & anomalies</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
