import { type MemberBalance } from "./balance-engine";

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

export interface SettlementSuggestion {
  from: string;       // userId of debtor
  fromName: string;   // name of debtor
  to: string;         // userId of creditor
  toName: string;     // name of creditor
  amount: number;     // amount in INR
}

// ──────────────────────────────────────────
// Debt Simplification Algorithm
// ──────────────────────────────────────────

/**
 * Simplify debts using a greedy algorithm.
 * 
 * Algorithm:
 * 1. Separate members into creditors (netBalance > 0) and debtors (netBalance < 0)
 * 2. Sort creditors descending, debtors ascending (most owed first)
 * 3. Match largest debtor with largest creditor
 * 4. Transfer min(debt, credit) between them
 * 5. Repeat until all debts settled
 * 
 * This produces the minimum number of transactions.
 * 
 * Example from the assignment:
 *   A owes 100, B owes 200, C should receive 300
 *   → A pays C 100, B pays C 200
 */
export function simplifyDebts(
  memberBalances: MemberBalance[]
): SettlementSuggestion[] {
  const suggestions: SettlementSuggestion[] = [];

  // Create mutable copies
  const creditors: { userId: string; name: string; amount: number }[] = [];
  const debtors: { userId: string; name: string; amount: number }[] = [];

  for (const mb of memberBalances) {
    if (mb.netBalance > 0.01) {
      creditors.push({
        userId: mb.userId,
        name: mb.name,
        amount: mb.netBalance,
      });
    } else if (mb.netBalance < -0.01) {
      debtors.push({
        userId: mb.userId,
        name: mb.name,
        amount: Math.abs(mb.netBalance),
      });
    }
  }

  // Sort: largest amounts first
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Greedy matching
  let i = 0; // creditor index
  let j = 0; // debtor index

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const transferAmount = Math.min(creditor.amount, debtor.amount);
    const rounded = Math.round(transferAmount * 100) / 100;

    if (rounded > 0) {
      suggestions.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: rounded,
      });
    }

    creditor.amount -= transferAmount;
    debtor.amount -= transferAmount;

    // Move to next if settled
    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return suggestions;
}
