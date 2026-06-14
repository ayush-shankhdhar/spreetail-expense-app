"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Receipt, Search, Filter, Plus, ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((data) => setExpenses(data.expenses || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredExpenses = expenses.filter(exp => 
    exp.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    exp.group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exp.paidBy.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ledger</h1>
          <p className="text-sm text-muted-foreground mt-1">Every transaction across all your workspaces</p>
        </div>
        <Link href="/expenses/new">
          <Button className="w-full sm:w-auto">
            <Plus size={18} className="mr-2" />
            Record Expense
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input 
            type="text" 
            placeholder="Search by description, group, or person..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter size={16} className="mr-2" />
          Filter
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-16 w-full rounded-lg" />)}
            </div>
          </div>
        </Card>
      ) : expenses.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed border-2 bg-transparent text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
            <Receipt size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-2">No expenses yet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">Your ledger is empty. Add a new expense manually or import from a CSV file.</p>
          <div className="flex gap-3">
            <Link href="/expenses/new">
              <Button>Record Expense</Button>
            </Link>
            <Link href="/import">
              <Button variant="secondary">Import CSV</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  <th className="p-4 font-medium w-1/4">Transaction</th>
                  <th className="p-4 font-medium hidden md:table-cell">Context</th>
                  <th className="p-4 font-medium">Details</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <motion.tbody variants={containerVariants} initial="hidden" animate="visible" className="divide-y divide-border/50">
                {filteredExpenses.map((exp) => {
                  const isRefund = decimalToNumber(exp.amount) < 0;
                  return (
                    <motion.tr 
                      key={exp.id} 
                      variants={itemVariants}
                      className="group hover:bg-surface-hover/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isRefund ? 'bg-success-glow text-success' : 'bg-surface-active text-muted-foreground'}`}>
                            {isRefund ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm group-hover:text-accent transition-colors">{exp.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(exp.expenseDate)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <Link href={`/groups/${exp.group.id}`} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-active text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-border transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-purple"></span>
                          {exp.group.name}
                        </Link>
                        {exp.notes && (
                          <p className="text-xs text-muted-foreground mt-2 truncate max-w-xs">{exp.notes}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full bg-surface-active flex items-center justify-center text-[10px] font-bold">
                            {exp.paidBy.name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium">{exp.paidBy.name}</span>
                          <span className="text-xs text-muted-foreground">paid</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-surface-active text-muted-foreground border border-border">
                            {exp.splitType}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            with {exp.participants.length} others
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right align-top">
                        <div className={`font-semibold text-base ${isRefund ? 'text-success' : 'text-foreground'}`}>
                          {formatCurrency(Math.abs(decimalToNumber(exp.amount)), exp.currency)}
                        </div>
                        {exp.currency === "USD" ? (
                          <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-warning/10 text-warning border border-warning/20">
                            USD
                          </span>
                        ) : (
                          <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-surface-active text-muted-foreground border border-border">
                            INR
                          </span>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <button className="p-1.5 rounded-md text-muted-foreground hover:bg-surface-active hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
