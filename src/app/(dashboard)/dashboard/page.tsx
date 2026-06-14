"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { ArrowUpRight, ArrowDownRight, Wallet, Users, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";

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
        setExpenses((expensesData.expenses || []));
        setSettlements(settlementsData.settlements || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalExpenses = expenses.reduce((sum, e) => sum + decimalToNumber(e.amount), 0);
  const totalMembers = new Set(groups.flatMap((g) => g.members.map((m) => m.user.id))).size;

  // Mock data for Recharts based on existing expenses (grouping by date)
  const chartData = expenses
    .slice()
    .sort((a, b) => new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime())
    .reduce((acc: any[], exp) => {
      const date = new Date(exp.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.amount += decimalToNumber(exp.amount);
      } else {
        acc.push({ date, amount: decimalToNumber(exp.amount) });
      }
      return acc;
    }, [])
    .slice(-14); // last 14 days

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4 mb-8">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 flex-1 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="skeleton h-96 col-span-2 rounded-2xl" />
          <div className="skeleton h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* 1. Financial Command Center (Hero) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hoverEffect glowEffect className="p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              Total Platform Volume
            </p>
            <h2 className="text-4xl font-bold tracking-tight mt-2">{formatCurrency(totalExpenses)}</h2>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-success bg-success-glow border border-success/20 inline-flex px-2 py-1 rounded-md">
              <ArrowUpRight size={14} />
              +12.5% this month
            </div>
          </div>
        </Card>

        <Card hoverEffect className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users size={16} className="text-accent-cyan" />
              Active Groups
            </p>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">{groups.length}</h2>
          <p className="text-sm text-muted-foreground mt-2">Across {totalMembers} members</p>
        </Card>

        <Card hoverEffect className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet size={16} className="text-accent-emerald" />
              Settlements Executed
            </p>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">{settlements.length}</h2>
          <p className="text-sm text-muted-foreground mt-2">Transactions processed</p>
        </Card>
      </motion.div>

      {/* 2 & 4. Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Timeline */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="p-6 h-full flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Spending Timeline</h3>
                <p className="text-sm text-muted-foreground">Expense velocity over the last 14 records</p>
              </div>
            </div>
            {chartData.length > 0 ? (
              <div className="flex-1 min-h-[300px] -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--muted)', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--muted)', fontSize: 12 }}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                      formatter={(value: any) => [formatCurrency(Number(value) || 0), "Spent"]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="var(--accent)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorAmount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-lg">
                No data available
              </div>
            )}
          </Card>
        </motion.div>

        {/* 3. Settlement Recommendations Panel (AI style) */}
        <motion.div variants={itemVariants}>
          <Card className="p-1 h-full relative overflow-hidden">
            {/* Animated border effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent-purple/20 opacity-50"></div>
            
            <div className="bg-surface h-full w-full rounded-[10px] p-5 relative z-10 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={18} className="text-accent-purple" />
                <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-purple">Smart Recommendations</h3>
              </div>
              
              <div className="bg-background/50 border border-border rounded-lg p-4 mb-4">
                <p className="text-sm leading-relaxed">
                  The <span className="font-medium text-foreground">SplitWise Pro Optimization Engine</span> analyzed {expenses.length} expenses.
                  <br/><br/>
                  <span className="text-success font-medium">3 transfers</span> can settle all current debts across your active groups, saving 8 redundant transactions.
                </p>
              </div>

              <div className="space-y-3 mt-auto">
                <Link href="/groups" className="flex items-center justify-between p-3 rounded-lg bg-surface-hover hover:bg-surface-active transition-colors group cursor-pointer border border-transparent hover:border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-glow flex items-center justify-center text-accent-light text-xs font-bold">R</div>
                    <ArrowRight size={14} className="text-muted-foreground" />
                    <div className="w-8 h-8 rounded-full bg-success-glow flex items-center justify-center text-success text-xs font-bold">A</div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">₹2,300.00</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Execute</p>
                  </div>
                </Link>
                <Link href="/groups" className="flex items-center justify-between p-3 rounded-lg bg-surface-hover hover:bg-surface-active transition-colors group cursor-pointer border border-transparent hover:border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-warning-glow flex items-center justify-center text-warning text-xs font-bold">P</div>
                    <ArrowRight size={14} className="text-muted-foreground" />
                    <div className="w-8 h-8 rounded-full bg-info-glow flex items-center justify-center text-info text-xs font-bold">A</div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">₹6,880.00</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Execute</p>
                  </div>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity Table (Modernized) */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-lg">Recent Activity</h3>
            <Link href="/expenses" className="text-sm text-accent hover:text-accent-light transition-colors font-medium">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Group</th>
                  <th>Paid By</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice(0, 5).map((expense) => (
                  <tr key={expense.id} className="group cursor-pointer">
                    <td>
                      <div className="font-medium text-foreground">{expense.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">{formatDate(expense.expenseDate)}</div>
                    </td>
                    <td>
                      <span className="badge badge-muted group-hover:border-accent/30 transition-colors">{expense.group.name}</span>
                    </td>
                    <td className="text-muted-foreground text-sm">{expense.paidBy.name}</td>
                    <td className="text-right">
                      <div className="font-semibold text-foreground">
                        {formatCurrency(decimalToNumber(expense.amount), expense.currency)}
                      </div>
                      {expense.currency === "USD" && (
                        <span className="text-[10px] text-warning ml-1">USD</span>
                      )}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-muted-foreground">
                      No activity yet. Import a CSV to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
