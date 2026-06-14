import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settlements = await prisma.settlement.findMany({
      where: {
        group: {
          members: {
            some: { userId: session.userId },
          },
        },
      },
      include: {
        payer: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ settlements });
  } catch (error) {
    console.error("Get settlements error:", error);
    return NextResponse.json({ error: "Failed to fetch settlements" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { payerId, receiverId, groupId, amount, date } = body;

    if (!payerId || !receiverId || !groupId || !amount) {
      return NextResponse.json(
        { error: "payerId, receiverId, groupId, and amount are required" },
        { status: 400 }
      );
    }

    const settlement = await prisma.settlement.create({
      data: {
        payerId,
        receiverId,
        groupId,
        amount,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        payer: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ settlement }, { status: 201 });
  } catch (error) {
    console.error("Create settlement error:", error);
    return NextResponse.json({ error: "Failed to create settlement" }, { status: 500 });
  }
}
