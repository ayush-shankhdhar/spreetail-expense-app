import { NextRequest, NextResponse } from "next/server";
import { parseCSV } from "@/lib/csv-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const text = await file.text();

    const rows = parseCSV(text);

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      data: rows.slice(0, 5),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}