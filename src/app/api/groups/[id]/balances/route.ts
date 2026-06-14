import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { calculateGroupBalances } from "@/lib/balance-engine";
import { simplifyDebts } from "@/lib/debt-simplifier";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const balances = await calculateGroupBalances(id);
    const suggestions = simplifyDebts(balances.memberBalances);

    return NextResponse.json({
      ...balances,
      settlementSuggestions: suggestions,
    });
  } catch (error) {
    console.error("Balance calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate balances" },
      { status: 500 }
    );
  }
}
