import Papa from "papaparse";

export interface CsvRow {
  date: string;
  description: string;
  paid_by: string;
  amount: string;
  currency: string;
  split_type: string;
  split_with: string;
  split_details: string;
  notes: string;
}

export interface ParsedRow extends CsvRow {
  rowNumber: number;
  originalValues: Partial<CsvRow>;
}

/**
 * Parse CSV text into structured rows.
 * Trims whitespace from all fields and tracks original values.
 */
export function parseCSV(csvText: string): ParsedRow[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  return result.data.map((row, index) => {
    const cleaned: CsvRow = {
      date: (row.date || "").trim(),
      description: (row.description || "").trim(),
      paid_by: (row.paid_by || "").trim(),
      amount: (row.amount || "").trim(),
      currency: (row.currency || "").trim(),
      split_type: (row.split_type || "").trim(),
      split_with: (row.split_with || "").trim(),
      split_details: (row.split_details || "").trim(),
      notes: (row.notes || "").trim(),
    };

    return {
      ...cleaned,
      rowNumber: index + 2, // +2 for header row + 1-indexed
      originalValues: { ...cleaned },
    };
  });
}

/**
 * Parse a date string that could be in many formats:
 * - YYYY-MM-DD (ISO)
 * - DD/MM/YYYY
 * - MM/DD/YYYY (ambiguous — we treat as DD/MM/YYYY)
 * - "Mar 14" (text month, no year)
 * - "14-Mar" (day-text month)
 *
 * Returns { date, isAmbiguous, originalFormat, fixApplied }
 */
export function parseDate(dateStr: string): {
  date: Date | null;
  isAmbiguous: boolean;
  originalFormat: string;
  fixApplied: string | null;
} {
  const s = dateStr.trim();

  // ISO format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + "T00:00:00");
    return { date: d, isAmbiguous: false, originalFormat: "ISO", fixApplied: null };
  }

  // DD/MM/YYYY or MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split("/");
    const a = parseInt(parts[0], 10);
    const b = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // We interpret as DD/MM/YYYY (Indian convention)
    const day = a;
    const month = b;
    const isAmbiguous = a <= 12 && b <= 12 && a !== b;
    const d = new Date(year, month - 1, day);
    return {
      date: d,
      isAmbiguous,
      originalFormat: "DD/MM/YYYY",
      fixApplied: isAmbiguous ? `Interpreted ${s} as DD/MM/YYYY → ${d.toISOString().split("T")[0]}` : null,
    };
  }

  // "Mar 14" or "Mar 14, 2026" — text month
  const textMonthMatch = s.match(/^([A-Za-z]+)\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?$/);
  if (textMonthMatch) {
    const monthStr = textMonthMatch[1];
    const day = parseInt(textMonthMatch[2], 10);
    const year = textMonthMatch[3] ? parseInt(textMonthMatch[3], 10) : 2026; // Default year
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const monthIndex = months[monthStr.toLowerCase().slice(0, 3)];
    if (monthIndex !== undefined) {
      const d = new Date(year, monthIndex, day);
      return {
        date: d,
        isAmbiguous: false,
        originalFormat: "text-month",
        fixApplied: `Parsed "${s}" as ${d.toISOString().split("T")[0]} (assumed year ${year})`,
      };
    }
  }

  // "14-Mar" or "14-Mar-2026"
  const dayTextMatch = s.match(/^(\d{1,2})-([A-Za-z]+)(?:-(\d{4}))?$/);
  if (dayTextMatch) {
    const day = parseInt(dayTextMatch[1], 10);
    const monthStr = dayTextMatch[2];
    const year = dayTextMatch[3] ? parseInt(dayTextMatch[3], 10) : 2026;
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const monthIndex = months[monthStr.toLowerCase().slice(0, 3)];
    if (monthIndex !== undefined) {
      const d = new Date(year, monthIndex, day);
      return {
        date: d,
        isAmbiguous: false,
        originalFormat: "day-text-month",
        fixApplied: `Parsed "${s}" as ${d.toISOString().split("T")[0]}`,
      };
    }
  }

  return { date: null, isAmbiguous: false, originalFormat: "unknown", fixApplied: null };
}

/**
 * Parse amount string, handling commas, whitespace, etc.
 */
export function parseAmount(amountStr: string): {
  value: number | null;
  fixApplied: string | null;
} {
  const s = amountStr.trim();
  if (!s) return { value: null, fixApplied: null };

  // Remove commas from formatted numbers like "1,200"
  const cleaned = s.replace(/,/g, "");
  const num = parseFloat(cleaned);

  if (isNaN(num)) return { value: null, fixApplied: null };

  const fixes: string[] = [];
  if (s !== cleaned) fixes.push(`Removed commas from "${s}"`);
  if (s !== s.trim()) fixes.push(`Trimmed whitespace from amount`);

  return {
    value: num,
    fixApplied: fixes.length > 0 ? fixes.join("; ") : null,
  };
}

/**
 * Normalize a name: trim, title case, remove suffixes like "S"
 */
export function normalizeName(name: string): {
  normalized: string;
  fixApplied: string | null;
} {
  const trimmed = name.trim();
  if (!trimmed) return { normalized: "", fixApplied: null };

  // Known name mappings for the flatmate CSV
  const knownNames = ["Aisha", "Rohan", "Priya", "Meera", "Dev", "Sam"];

  // Check for exact match (case-insensitive)
  const lowerTrimmed = trimmed.toLowerCase();
  for (const known of knownNames) {
    if (lowerTrimmed === known.toLowerCase()) {
      if (trimmed !== known) {
        return {
          normalized: known,
          fixApplied: `Normalized name "${trimmed}" → "${known}"`,
        };
      }
      return { normalized: known, fixApplied: null };
    }
  }

  // Check for name with suffix (e.g., "Priya S")
  for (const known of knownNames) {
    if (lowerTrimmed.startsWith(known.toLowerCase() + " ")) {
      return {
        normalized: known,
        fixApplied: `Normalized name "${trimmed}" → "${known}" (removed suffix)`,
      };
    }
  }

  // Title case as fallback
  const titleCased = trimmed
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  if (titleCased !== trimmed) {
    return {
      normalized: titleCased,
      fixApplied: `Title-cased name "${trimmed}" → "${titleCased}"`,
    };
  }

  return { normalized: trimmed, fixApplied: null };
}

/**
 * Parse split_with field into array of participant names
 */
export function parseSplitWith(splitWith: string): string[] {
  if (!splitWith.trim()) return [];
  return splitWith
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parse split_details field into a map of name -> value
 * Handles formats like: "Rohan 700; Priya 400; Meera 400"
 *                    or: "Aisha 30%; Rohan 30%; Priya 30%; Meera 20%"
 *                    or: "Aisha 2; Rohan 1; Priya 1"
 */
export function parseSplitDetails(
  splitDetails: string
): Map<string, number> {
  const map = new Map<string, number>();
  if (!splitDetails.trim()) return map;

  const parts = splitDetails.split(";").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    // Match "Name value" or "Name value%"
    const match = part.match(/^(.+?)\s+([\d.]+)%?$/);
    if (match) {
      const name = match[1].trim();
      const value = parseFloat(match[2]);
      if (!isNaN(value)) {
        map.set(name, value);
      }
    }
  }

  return map;
}