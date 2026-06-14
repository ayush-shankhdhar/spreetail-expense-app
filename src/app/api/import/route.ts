import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { parseCSV, parseSplitWith, normalizeName } from "@/lib/csv-parser";
import { runFullAnomalyDetection, type ProcessedRow } from "@/lib/anomaly-detector";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const groupId = formData.get("groupId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }

    const text = await file.text();

    // Phase 1: Parse CSV
    const rows = parseCSV(text);

    // Phase 2: Run anomaly detection
    const result = runFullAnomalyDetection(rows);

    // Phase 3: Ensure all users exist in DB
    const userMap = await ensureUsersExist(result.processedRows);

    // Phase 4: Ensure all users are group members
    await ensureGroupMembers(groupId, userMap);

    // Phase 5: Import valid rows as expenses or settlements
    let importedCount = 0;
    let settlementCount = 0;

    for (const row of result.processedRows) {
      if (row.skip) continue;

      if (row.isSettlement) {
        await importSettlement(row, groupId, userMap);
        settlementCount++;
        continue;
      }

      await importExpense(row, groupId, userMap);
      importedCount++;
    }

    // Phase 6: Create import session with anomalies
    const importSession = await prisma.importSession.create({
      data: {
        filename: file.name,
        totalRows: result.totalRows,
        imported: importedCount,
        skipped: result.totalRows - importedCount - settlementCount,
        anomalies: {
          create: result.anomalies.map((a) => ({
            rowNumber: a.rowNumber,
            anomalyType: a.anomalyType,
            originalValue: a.originalValue || null,
            fixedValue: a.fixedValue || null,
            actionTaken: a.actionTaken,
          })),
        },
      },
      include: {
        anomalies: {
          orderBy: { rowNumber: "asc" },
        },
      },
    });

    // Phase 7: Generate import report
    const report = {
      totalRows: result.totalRows,
      importedRows: importedCount,
      skippedRows: result.totalRows - importedCount - settlementCount,
      settlementsDetected: settlementCount,
      anomalies: result.anomalies.map((a) => ({
        rowNumber: a.rowNumber,
        anomalyType: a.anomalyType,
        originalValue: a.originalValue,
        fixedValue: a.fixedValue,
        actionTaken: a.actionTaken,
      })),
      importSessionId: importSession.id,
    };

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.importSession.findMany({
      include: {
        anomalies: {
          orderBy: { rowNumber: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Get import sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch import history" }, { status: 500 });
  }
}

// ──────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────

async function ensureUsersExist(
  rows: ProcessedRow[]
): Promise<Map<string, string>> {
  const userMap = new Map<string, string>(); // name -> userId

  // Collect all unique names from paidBy and participants
  const allNames = new Set<string>();
  for (const row of rows) {
    if (row.skip) continue;
    if (row.paidBy) allNames.add(row.paidBy);
    for (const p of row.participants) {
      allNames.add(p);
    }
  }

  for (const name of allNames) {
    const email = `${name.toLowerCase()}@flatmates.app`;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: "$2a$12$placeholder.hash.for.csv.imported.users",
        },
      });
    }
    userMap.set(name, user.id);
  }

  return userMap;
}

async function ensureGroupMembers(
  groupId: string,
  userMap: Map<string, string>
): Promise<void> {
  // Member timeline for setting join/leave dates
  const MEMBER_TIMELINE: Record<string, { join: string; leave: string | null }> = {
    Aisha: { join: "2026-02-01", leave: null },
    Rohan: { join: "2026-02-01", leave: null },
    Priya: { join: "2026-02-01", leave: null },
    Meera: { join: "2026-02-01", leave: "2026-03-31" },
    Dev: { join: "2026-03-08", leave: "2026-03-14" }, // Goa trip visitor
    Sam: { join: "2026-04-15", leave: null },
  };

  for (const [name, userId] of userMap) {
    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (!existing) {
      const timeline = MEMBER_TIMELINE[name];
      await prisma.groupMember.create({
        data: {
          userId,
          groupId,
          joinDate: timeline ? new Date(timeline.join) : new Date("2026-02-01"),
          leaveDate: timeline?.leave ? new Date(timeline.leave) : null,
        },
      });
    }
  }
}

async function importExpense(
  row: ProcessedRow,
  groupId: string,
  userMap: Map<string, string>
): Promise<void> {
  const payerId = userMap.get(row.paidBy);
  if (!payerId) return;

  // Calculate share amounts based on split type
  const participants = row.participants
    .map((name) => userMap.get(name))
    .filter(Boolean) as string[];

  if (participants.length === 0) return;

  let shares: { userId: string; shareAmount: number }[] = [];
  const amount = Math.abs(row.amount); // Use absolute value for share calculation
  const isRefund = row.amount < 0;

  switch (row.splitType) {
    case "equal": {
      const shareAmount = Math.round((amount / participants.length) * 100) / 100;
      shares = participants.map((userId) => ({
        userId,
        shareAmount: isRefund ? -shareAmount : shareAmount,
      }));
      // Fix rounding
      const diff = Math.round((amount - shareAmount * participants.length) * 100) / 100;
      if (diff !== 0 && shares.length > 0) {
        shares[0].shareAmount += isRefund ? -diff : diff;
      }
      break;
    }

    case "percentage": {
      shares = participants.map((userId) => {
        const name = [...userMap.entries()].find(([, id]) => id === userId)?.[0] || "";
        const pct = row.splitDetails.get(name) || (100 / participants.length);
        const shareAmount = Math.round((amount * pct / 100) * 100) / 100;
        return { userId, shareAmount: isRefund ? -shareAmount : shareAmount };
      });
      break;
    }

    case "share": {
      // Weighted split: "Aisha 1; Rohan 2" means 1:2 ratio
      let totalWeight = 0;
      const weights = participants.map((userId) => {
        const name = [...userMap.entries()].find(([, id]) => id === userId)?.[0] || "";
        const weight = row.splitDetails.get(name) || 1;
        totalWeight += weight;
        return { userId, weight };
      });

      shares = weights.map(({ userId, weight }) => {
        const shareAmount = Math.round((amount * weight / totalWeight) * 100) / 100;
        return { userId, shareAmount: isRefund ? -shareAmount : shareAmount };
      });
      break;
    }

    case "unequal": {
      shares = participants.map((userId) => {
        const name = [...userMap.entries()].find(([, id]) => id === userId)?.[0] || "";
        const shareAmount = row.splitDetails.get(name) || 0;
        return { userId, shareAmount: isRefund ? -shareAmount : shareAmount };
      });
      break;
    }

    default: {
      // Default to equal
      const shareAmount = Math.round((amount / participants.length) * 100) / 100;
      shares = participants.map((userId) => ({
        userId,
        shareAmount: isRefund ? -shareAmount : shareAmount,
      }));
      break;
    }
  }

  await prisma.expense.create({
    data: {
      description: row.description,
      amount: row.amount,
      currency: row.currency,
      expenseDate: row.date,
      splitType: row.splitType || "equal",
      notes: row.notes || null,
      paidById: payerId,
      groupId,
      participants: {
        create: shares,
      },
    },
  });
}

async function importSettlement(
  row: ProcessedRow,
  groupId: string,
  userMap: Map<string, string>
): Promise<void> {
  const payerId = userMap.get(row.paidBy);
  const receiverName = row.participants[0];
  const receiverId = receiverName ? userMap.get(receiverName) : null;

  if (!payerId || !receiverId) return;

  await prisma.settlement.create({
    data: {
      payerId,
      receiverId,
      groupId,
      amount: Math.abs(row.amount),
      date: row.date,
    },
  });
}