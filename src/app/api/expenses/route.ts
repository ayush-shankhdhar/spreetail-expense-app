import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createExpenseSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    const where: Record<string, unknown> = {};
    if (groupId) where.groupId = groupId;

    // Only show expenses from groups the user is a member of
    const expenses = await prisma.expense.findMany({
      where: {
        ...where,
        group: {
          members: {
            some: { userId: session.userId },
          },
        },
      },
      include: {
        paidBy: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
        participants: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { expenseDate: "desc" },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Get expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { description, amount, currency, expenseDate, paidById, groupId, splitType, notes, participants } = parsed.data;

    // Calculate share amounts based on split type
    let calculatedParticipants = participants;

    if (splitType === "equal") {
      const shareAmount = Math.round((amount / participants.length) * 100) / 100;
      calculatedParticipants = participants.map((p) => ({
        ...p,
        shareAmount,
      }));
      // Adjust for rounding
      const diff = Math.round((amount - shareAmount * participants.length) * 100) / 100;
      if (diff !== 0 && calculatedParticipants.length > 0) {
        calculatedParticipants[0].shareAmount += diff;
      }
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        amount,
        currency,
        expenseDate: new Date(expenseDate),
        paidById,
        groupId,
        splitType,
        notes: notes || null,
        participants: {
          create: calculatedParticipants.map((p) => ({
            userId: p.userId,
            shareAmount: p.shareAmount,
          })),
        },
      },
      include: {
        paidBy: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
        participants: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
