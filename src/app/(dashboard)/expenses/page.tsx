"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";

interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: string;
  splitType: string;
  notes: string | null;
  paidBy: { id: string; name: string };
  group: { id: string; name: string };
  participants: { user: { id: string; name: string }; shareAmount: number }[];
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((data) => setExpenses(data.expenses || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Expenses</h1>
        <div className="skeleton h-96" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>All your shared expenses</p>
        </div>
        <Link href="/expenses/new" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Expense
        </Link>
      </div>

      {expenses.length === 0 ? (
        <div className="empty-state glass-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <p className="text-lg font-medium mt-4">No expenses yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Add expenses manually or import from CSV</p>
          <div className="flex gap-3 mt-4">
            <Link href="/expenses/new" className="btn btn-primary btn-sm">Add Expense</Link>
            <Link href="/import" className="btn btn-secondary btn-sm">Import CSV</Link>
          </div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Group</th>
                <th>Paid By</th>
                <th>Split</th>
                <th>Participants</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td className="text-sm" style={{ color: "var(--muted)" }}>
                    {formatDate(exp.expenseDate)}
                  </td>
                  <td>
                    <div>
                      <p className="font-medium text-sm">{exp.description}</p>
                      {exp.notes && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{exp.notes}</p>
                      )}
                    </div>
                  </td>
                  <td>
                    <Link href={`/groups/${exp.group.id}`} className="text-sm" style={{ color: "var(--accent-light)" }}>
                      {exp.group.name}
                    </Link>
                  </td>
                  <td className="text-sm">{exp.paidBy.name}</td>
                  <td><span className="badge badge-muted">{exp.splitType}</span></td>
                  <td className="text-sm" style={{ color: "var(--muted)" }}>
                    {exp.participants.map((p) => p.user.name).join(", ")}
                  </td>
                  <td className="text-right">
                    <span className="font-semibold text-sm">
                      {formatCurrency(decimalToNumber(exp.amount), exp.currency)}
                    </span>
                    {exp.currency === "USD" && (
                      <span className="badge badge-warning ml-2">USD</span>
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
