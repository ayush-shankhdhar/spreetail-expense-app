"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";

interface Settlement {
  id: string;
  amount: number;
  date: string;
  payer: { id: string; name: string };
  receiver: { id: string; name: string };
  group: { id: string; name: string };
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settlements")
      .then((r) => r.json())
      .then((data) => setSettlements(data.settlements || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Settlements</h1>
        <div className="skeleton h-64" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settlements</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Payment records between members
        </p>
      </div>

      {settlements.length === 0 ? (
        <div className="empty-state glass-card">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5">
            <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
          </svg>
          <p className="text-lg font-medium mt-4">No settlements yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Settlements will appear here when members settle their debts
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>From</th>
                <th></th>
                <th>To</th>
                <th>Group</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => (
                <tr key={s.id}>
                  <td className="text-sm" style={{ color: "var(--muted)" }}>
                    {formatDate(s.date)}
                  </td>
                  <td className="font-medium text-sm">{s.payer.name}</td>
                  <td>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </td>
                  <td className="font-medium text-sm">{s.receiver.name}</td>
                  <td className="text-sm" style={{ color: "var(--muted)" }}>{s.group.name}</td>
                  <td className="text-right font-bold" style={{ color: "var(--success)" }}>
                    {formatCurrency(decimalToNumber(s.amount))}
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
