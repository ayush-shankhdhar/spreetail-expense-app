"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDate, decimalToNumber } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowRight, CheckCircle2, CircleDollarSign } from "lucide-react";

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  // Flow animation variants for the arrows
  const arrowVariants = {
    initial: { x: -5, opacity: 0.5 },
    animate: { 
      x: [0, 5, 0], 
      opacity: [0.5, 1, 0.5],
      transition: { 
        duration: 1.5, 
        repeat: Infinity
      } 
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settlement Engine</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Immutable ledger of executed debt resolutions
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 w-full rounded-xl" />)}
        </div>
      ) : settlements.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed border-2 bg-transparent text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
            <CircleDollarSign size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-2">No settlements found</h3>
          <p className="text-muted-foreground max-w-sm">
            Settlements appear here when debts are resolved via the optimization engine in your groups.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {settlements.map((s, index) => (
              <motion.div key={s.id} variants={itemVariants} layout>
                <Card className="p-0 overflow-hidden group border-border hover:border-accent/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-stretch">
                    {/* Visual Flow Representation */}
                    <div className="flex-1 p-6 flex items-center justify-between relative bg-surface-hover/30">
                      {/* Payer Node */}
                      <div className="flex flex-col items-center gap-3 relative z-10 w-1/3">
                        <div className="w-12 h-12 rounded-full bg-danger-glow border border-danger/30 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)] group-hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] transition-all">
                          <span className="text-danger font-bold text-lg">{s.payer.name.charAt(0)}</span>
                        </div>
                        <span className="font-semibold text-sm">{s.payer.name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Sender</span>
                      </div>

                      {/* Animated Flow Arrow */}
                      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-0">
                        <div className="w-full h-px bg-gradient-to-r from-danger/50 via-accent/50 to-success/50 absolute top-1/2 -translate-y-1/2" />
                        <motion.div 
                          variants={arrowVariants} 
                          initial="initial" 
                          animate="animate"
                          className="bg-background px-2 relative z-10"
                        >
                          <ArrowRight className="text-accent" size={20} />
                        </motion.div>
                        <div className="absolute -top-6 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border">
                          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-cyan">
                            {formatCurrency(decimalToNumber(s.amount))}
                          </span>
                        </div>
                      </div>

                      {/* Receiver Node */}
                      <div className="flex flex-col items-center gap-3 relative z-10 w-1/3">
                        <div className="w-12 h-12 rounded-full bg-success-glow border border-success/30 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all">
                          <span className="text-success font-bold text-lg">{s.receiver.name.charAt(0)}</span>
                        </div>
                        <span className="font-semibold text-sm">{s.receiver.name}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Recipient</span>
                      </div>
                    </div>

                    {/* Meta Data Panel */}
                    <div className="w-full md:w-64 bg-surface p-6 border-t md:border-t-0 md:border-l border-border flex flex-col justify-center gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-success" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-success">Settled</span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Execution Date</p>
                        <p className="text-sm font-medium">{formatDate(s.date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Workspace</p>
                        <p className="text-sm font-medium text-accent-light">{s.group.name}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
