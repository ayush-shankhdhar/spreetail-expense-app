"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  members: { user: { id: string; name: string } }[];
}

export default function NewExpensePage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [selectedGroup, setSelectedGroup] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidById, setPaidById] = useState("");
  const [splitType, setSplitType] = useState("equal");
  const [notes, setNotes] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((data) => {
        setGroups(data.groups || []);
        if (data.groups?.length > 0) {
          setSelectedGroup(data.groups[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // When group changes, select all members as participants
  useEffect(() => {
    const group = groups.find((g) => g.id === selectedGroup);
    if (group) {
      setSelectedParticipants(group.members.map((m) => m.user.id));
      if (!paidById && group.members.length > 0) {
        setPaidById(group.members[0].user.id);
      }
    }
  }, [selectedGroup, groups]);

  const currentGroup = groups.find((g) => g.id === selectedGroup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setError("Amount must be a positive number");
        return;
      }

      // Calculate shares based on split type
      const participants = selectedParticipants.map((userId) => ({
        userId,
        shareAmount: amountNum / selectedParticipants.length,
      }));

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount: amountNum,
          currency,
          expenseDate,
          paidById,
          groupId: selectedGroup,
          splitType,
          notes: notes || undefined,
          participants,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create expense");
        return;
      }

      router.push("/expenses");
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Add Expense</h1>
        <div className="skeleton h-96" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/expenses" className="btn btn-ghost p-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Expense</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Record a new shared expense</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--danger-glow)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Group</label>
            <select
              className="input"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              required
            >
              <option value="">Select group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Paid By</label>
            <select
              className="input"
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
              required
            >
              <option value="">Select payer</option>
              {currentGroup?.members.map((m) => (
                <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Dinner at Thalassa"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Amount</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="label">Currency</label>
            <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>

          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Split Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {["equal", "percentage", "share", "unequal"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSplitType(type)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                  splitType === type
                    ? "border-[var(--accent)] text-[var(--accent-light)]"
                    : "border-[var(--border)]"
                }`}
                style={splitType === type ? { background: "var(--accent-glow)" } : { background: "var(--card)", color: "var(--muted)" }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Participants */}
        {currentGroup && (
          <div>
            <label className="label">Split With</label>
            <div className="flex flex-wrap gap-2">
              {currentGroup.members.map((m) => {
                const isSelected = selectedParticipants.includes(m.user.id);
                return (
                  <button
                    key={m.user.id}
                    type="button"
                    onClick={() => {
                      setSelectedParticipants((prev) =>
                        isSelected
                          ? prev.filter((id) => id !== m.user.id)
                          : [...prev, m.user.id]
                      );
                    }}
                    className={`py-1.5 px-3 rounded-lg text-sm font-medium transition-all border ${
                      isSelected
                        ? "border-[var(--success)] text-[var(--success)]"
                        : "border-[var(--border)]"
                    }`}
                    style={isSelected ? { background: "var(--success-glow)" } : { background: "var(--card)", color: "var(--muted)" }}
                  >
                    {isSelected && "✓ "}{m.user.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            className="input"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary btn-lg flex-1" disabled={submitting}>
            {submitting ? "Creating..." : "Create Expense"}
          </button>
        </div>
      </form>
    </div>
  );
}
