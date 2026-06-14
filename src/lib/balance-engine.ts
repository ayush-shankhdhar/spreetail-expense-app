import { prisma } from "./prisma";
import { convertToINR } from "./currency";
import { decimalToNumber } from "./utils";

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

export interface MemberBalance {
  userId: string;
  name: string;
  totalPaid: number;       // Total amount this member paid for expenses (in INR)
  totalOwed: number;       // Total amount this member owes from splits (in INR)
  netBalance: number;      // paid - owed (positive = others owe them, negative = they owe)
  expenses: ExpenseDetail[];
}

export interface ExpenseDetail {
  expenseId: string;
  description: string;
  date: Date;
  amount: number;
  currency: string;
  amountINR: number;
  paidBy: string;
  shareAmount: number;
  role: "payer" | "participant" | "both";
}

export interface GroupBalanceSummary {
  groupId: string;
  groupName: string;
  totalExpenses: number;
  memberBalances: MemberBalance[];
}

// ──────────────────────────────────────────
// Balance Calculation
// ──────────────────────────────────────────

/**
 * Calculate balances for all members of a group.
 * 
 * For each member:
 *   totalPaid = sum of all expenses they paid for (converted to INR)
 *   totalOwed = sum of all their share amounts in expenses (converted to INR)
 *   netBalance = totalPaid - totalOwed
 * 
 * Positive netBalance = others owe this person
 * Negative netBalance = this person owes others
 */
export async function calculateGroupBalances(
  groupId: string
): Promise<GroupBalanceSummary> {
  // Get group with members
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: { user: true },
      },
      expenses: {
        include: {
          paidBy: true,
          participants: {
            include: { user: true },
          },
        },
        orderBy: { expenseDate: "desc" },
      },
    },
  });

  if (!group) throw new Error("Group not found");

  // Get settlements for this group
  const settlements = await prisma.settlement.findMany({
    where: { groupId },
    include: {
      payer: true,
      receiver: true,
    },
  });

  // Initialize balance map for each member
  const balanceMap = new Map<string, MemberBalance>();
  for (const member of group.members) {
    balanceMap.set(member.userId, {
      userId: member.userId,
      name: member.user.name,
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0,
      expenses: [],
    });
  }

  // Process each expense
  let totalExpenses = 0;
  for (const expense of group.expenses) {
    const amountINR = convertToINR(
      decimalToNumber(expense.amount),
      expense.currency
    );
    totalExpenses += amountINR;

    // Credit the payer
    const payerBalance = balanceMap.get(expense.paidById);
    if (payerBalance) {
      payerBalance.totalPaid += amountINR;
    }

    // Debit each participant their share
    for (const participant of expense.participants) {
      const shareINR = convertToINR(
        decimalToNumber(participant.shareAmount),
        expense.currency
      );

      const participantBalance = balanceMap.get(participant.userId);
      if (participantBalance) {
        participantBalance.totalOwed += shareINR;
        participantBalance.expenses.push({
          expenseId: expense.id,
          description: expense.description,
          date: expense.expenseDate,
          amount: decimalToNumber(expense.amount),
          currency: expense.currency,
          amountINR,
          paidBy: expense.paidBy.name,
          shareAmount: shareINR,
          role:
            participant.userId === expense.paidById
              ? "both"
              : "participant",
        });
      }
    }

    // Add payer-only expense detail if payer isn't a participant
    if (payerBalance) {
      const isAlsoParticipant = expense.participants.some(
        (p) => p.userId === expense.paidById
      );
      if (!isAlsoParticipant) {
        payerBalance.expenses.push({
          expenseId: expense.id,
          description: expense.description,
          date: expense.expenseDate,
          amount: decimalToNumber(expense.amount),
          currency: expense.currency,
          amountINR,
          paidBy: expense.paidBy.name,
          shareAmount: 0,
          role: "payer",
        });
      }
    }
  }

  // Apply settlements: payer reduces their debt, receiver reduces their credit
  for (const settlement of settlements) {
    const amount = decimalToNumber(settlement.amount);
    const payerBalance = balanceMap.get(settlement.payerId);
    const receiverBalance = balanceMap.get(settlement.receiverId);

    if (payerBalance) {
      // Payer paid money, so increase their "paid" amount
      payerBalance.totalPaid += amount;
    }
    if (receiverBalance) {
      // Receiver got paid, so increase their "owed" amount  
      receiverBalance.totalOwed += amount;
    }
  }

  // Calculate net balances
  const memberBalances: MemberBalance[] = [];
  balanceMap.forEach((balance) => {
    balance.netBalance = Math.round((balance.totalPaid - balance.totalOwed) * 100) / 100;
    balance.totalPaid = Math.round(balance.totalPaid * 100) / 100;
    balance.totalOwed = Math.round(balance.totalOwed * 100) / 100;
    memberBalances.push(balance);
  });

  // Sort by net balance (most owed first)
  memberBalances.sort((a, b) => b.netBalance - a.netBalance);

  return {
    groupId,
    groupName: group.name,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    memberBalances,
  };
}

/**
 * Get detailed balance for a single member showing every expense that contributes.
 * This fulfills Rohan's requirement: "If the app says I owe ₹2,300, I want to see exactly which expenses make that up."
 */
export async function calculateIndividualBalance(
  userId: string,
  groupId: string
): Promise<MemberBalance | null> {
  const summary = await calculateGroupBalances(groupId);
  return summary.memberBalances.find((mb) => mb.userId === userId) || null;
}
