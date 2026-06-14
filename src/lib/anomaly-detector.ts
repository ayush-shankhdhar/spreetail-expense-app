import {
  type ParsedRow,
  parseDate,
  parseAmount,
  normalizeName,
  parseSplitWith,
  parseSplitDetails,
} from "./csv-parser";

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────

export interface Anomaly {
  rowNumber: number;
  anomalyType: string;
  originalValue: string;
  fixedValue: string | null;
  actionTaken: string;
}

export interface ProcessedRow {
  rowNumber: number;
  date: Date;
  description: string;
  paidBy: string;
  amount: number;
  currency: string;
  splitType: string;
  participants: string[];
  splitDetails: Map<string, number>;
  notes: string;
  isSettlement: boolean;
  skip: boolean;
  skipReason?: string;
}

export interface ImportResult {
  processedRows: ProcessedRow[];
  anomalies: Anomaly[];
  totalRows: number;
  importedRows: number;
  skippedRows: number;
}

// ──────────────────────────────────────────
// Known Members & Timeline
// ──────────────────────────────────────────

const KNOWN_MEMBERS = ["Aisha", "Rohan", "Priya", "Meera", "Dev", "Sam"];

// Member timeline: when each member was active in the flat
const MEMBER_TIMELINE: Record<string, { join: Date; leave: Date | null }> = {
  Aisha: { join: new Date("2026-01-01"), leave: null },
  Rohan: { join: new Date("2026-01-01"), leave: null },
  Priya: { join: new Date("2026-01-01"), leave: null },
  Meera: { join: new Date("2026-01-01"), leave: new Date("2026-03-31") },
  Dev: { join: new Date("2026-01-01"), leave: null }, // Dev is a visitor, not a flatmate
  Sam: { join: new Date("2026-04-15"), leave: null },
};

function isMemberActive(name: string, date: Date): boolean {
  const timeline = MEMBER_TIMELINE[name];
  if (!timeline) return true; // Unknown members: assume active (will be flagged separately)
  if (date < timeline.join) return false;
  if (timeline.leave && date > timeline.leave) return false;
  return true;
}

// ──────────────────────────────────────────
// Main Detection Pipeline
// ──────────────────────────────────────────

export function runFullAnomalyDetection(rows: ParsedRow[]): ImportResult {
  const anomalies: Anomaly[] = [];
  const processedRows: ProcessedRow[] = [];

  // Phase 1: Parse and normalize each row
  for (const row of rows) {
    const processed = processRow(row, anomalies);
    processedRows.push(processed);
  }

  // Phase 2: Cross-row checks (duplicates)
  detectDuplicates(processedRows, anomalies);

  // Count imported vs skipped
  const importedRows = processedRows.filter((r) => !r.skip && !r.isSettlement).length;
  const skippedRows = processedRows.filter((r) => r.skip).length;
  const settlementRows = processedRows.filter((r) => r.isSettlement).length;

  return {
    processedRows,
    anomalies,
    totalRows: rows.length,
    importedRows: importedRows,
    skippedRows: skippedRows + settlementRows,
  };
}

// ──────────────────────────────────────────
// Per-Row Processing
// ──────────────────────────────────────────

function processRow(row: ParsedRow, anomalies: Anomaly[]): ProcessedRow {
  const result: ProcessedRow = {
    rowNumber: row.rowNumber,
    date: new Date(),
    description: row.description,
    paidBy: "",
    amount: 0,
    currency: "INR",
    splitType: row.split_type.toLowerCase(),
    participants: [],
    splitDetails: new Map(),
    notes: row.notes,
    isSettlement: false,
    skip: false,
  };

  // ── 1. Date parsing ──
  const dateResult = parseDate(row.date);
  if (!dateResult.date) {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "INVALID_DATE",
      originalValue: row.date,
      fixedValue: null,
      actionTaken: "Skipped — could not parse date",
    });
    result.skip = true;
    result.skipReason = "Invalid date";
    return result;
  }
  result.date = dateResult.date;

  if (dateResult.isAmbiguous) {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "AMBIGUOUS_DATE",
      originalValue: row.date,
      fixedValue: dateResult.date.toISOString().split("T")[0],
      actionTaken: `Interpreted as DD/MM/YYYY → ${dateResult.date.toISOString().split("T")[0]}`,
    });
  }

  if (dateResult.fixApplied) {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "DATE_FORMAT_FIXED",
      originalValue: row.date,
      fixedValue: dateResult.date.toISOString().split("T")[0],
      actionTaken: dateResult.fixApplied,
    });
  }

  // ── 2. Description check ──
  if (!row.description.trim()) {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "MISSING_DESCRIPTION",
      originalValue: "",
      fixedValue: null,
      actionTaken: "Skipped — missing description",
    });
    result.skip = true;
    result.skipReason = "Missing description";
    return result;
  }

  // ── 3. Payer normalization ──
  if (!row.paid_by.trim()) {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "MISSING_PAYER",
      originalValue: "",
      fixedValue: null,
      actionTaken: "Skipped — cannot determine who paid",
    });
    result.skip = true;
    result.skipReason = "Missing payer";
    return result;
  }

  const payerNorm = normalizeName(row.paid_by);
  result.paidBy = payerNorm.normalized;
  if (payerNorm.fixApplied) {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "NAME_VARIATION",
      originalValue: row.paid_by,
      fixedValue: payerNorm.normalized,
      actionTaken: payerNorm.fixApplied,
    });
  }

  // ── 4. Amount parsing ──
  const amountResult = parseAmount(row.amount);
  if (amountResult.value === null) {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "MISSING_AMOUNT",
      originalValue: row.amount,
      fixedValue: null,
      actionTaken: "Skipped — invalid or missing amount",
    });
    result.skip = true;
    result.skipReason = "Invalid amount";
    return result;
  }
  result.amount = amountResult.value;
  if (amountResult.fixApplied) {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "AMOUNT_FORMAT_FIXED",
      originalValue: row.amount,
      fixedValue: String(amountResult.value),
      actionTaken: amountResult.fixApplied,
    });
  }

  // ── 5. Zero amount ──
  if (result.amount === 0) {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "ZERO_AMOUNT",
      originalValue: row.amount,
      fixedValue: null,
      actionTaken: "Skipped — zero amount has no financial impact",
    });
    result.skip = true;
    result.skipReason = "Zero amount";
    return result;
  }

  // ── 6. Negative amount ──
  if (result.amount < 0) {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "NEGATIVE_AMOUNT",
      originalValue: row.amount,
      fixedValue: String(result.amount),
      actionTaken: "Imported as refund/credit (negative expense)",
    });
    // Don't skip — import as a refund
  }

  // ── 7. Excess decimal precision ──
  const amountStr = String(result.amount);
  const decimalIndex = amountStr.indexOf(".");
  if (decimalIndex !== -1 && amountStr.length - decimalIndex - 1 > 2) {
    const rounded = Math.round(result.amount * 100) / 100;
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "EXCESS_DECIMAL_PRECISION",
      originalValue: String(result.amount),
      fixedValue: String(rounded),
      actionTaken: `Rounded ${result.amount} → ${rounded}`,
    });
    result.amount = rounded;
  }

  // ── 8. Currency check ──
  if (!row.currency.trim()) {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "MISSING_CURRENCY",
      originalValue: "",
      fixedValue: "INR",
      actionTaken: "Defaulted to INR — currency was empty",
    });
    result.currency = "INR";
  } else {
    result.currency = row.currency.trim().toUpperCase();
  }

  if (result.currency === "USD") {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "USD_EXPENSE",
      originalValue: `${result.amount} USD`,
      fixedValue: null,
      actionTaken: "Imported with USD currency — will be converted at ₹83/USD for balance calculations",
    });
  }

  // ── 9. Settlement detection ──
  const isSettlement = detectSettlement(row, result);
  if (isSettlement) {
    result.isSettlement = true;
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "SETTLEMENT_AS_EXPENSE",
      originalValue: row.description,
      fixedValue: null,
      actionTaken: "Detected as settlement — imported as payment record, not expense",
    });
  }

  // ── 10. Participants ──
  const rawParticipants = parseSplitWith(row.split_with);
  const normalizedParticipants: string[] = [];
  for (const p of rawParticipants) {
    const norm = normalizeName(p);

    // Check for unknown participants
    if (!KNOWN_MEMBERS.includes(norm.normalized)) {
      anomalies.push({
        rowNumber: row.rowNumber,
        anomalyType: "INVALID_PARTICIPANT",
        originalValue: p,
        fixedValue: null,
        actionTaken: `Unknown participant "${p}" — excluded from split`,
      });
      continue;
    }

    // Check member timeline
    if (!isMemberActive(norm.normalized, result.date)) {
      const timeline = MEMBER_TIMELINE[norm.normalized];
      if (timeline?.leave && result.date > timeline.leave) {
        anomalies.push({
          rowNumber: row.rowNumber,
          anomalyType: "MEMBER_AFTER_LEAVING",
          originalValue: norm.normalized,
          fixedValue: null,
          actionTaken: `${norm.normalized} left on ${timeline.leave.toISOString().split("T")[0]} — excluded from this expense dated ${result.date.toISOString().split("T")[0]}`,
        });
        continue;
      }
      if (result.date < timeline!.join) {
        anomalies.push({
          rowNumber: row.rowNumber,
          anomalyType: "MEMBER_BEFORE_JOINING",
          originalValue: norm.normalized,
          fixedValue: null,
          actionTaken: `${norm.normalized} joined on ${timeline!.join.toISOString().split("T")[0]} — excluded from this expense dated ${result.date.toISOString().split("T")[0]}`,
        });
        continue;
      }
    }

    if (norm.fixApplied && !normalizedParticipants.includes(norm.normalized)) {
      anomalies.push({
        rowNumber: row.rowNumber,
        anomalyType: "NAME_VARIATION",
        originalValue: p,
        fixedValue: norm.normalized,
        actionTaken: norm.fixApplied,
      });
    }

    if (!normalizedParticipants.includes(norm.normalized)) {
      normalizedParticipants.push(norm.normalized);
    }
  }
  result.participants = normalizedParticipants;

  // ── 11. Split type and details ──
  if (row.split_details.trim()) {
    result.splitDetails = parseSplitDetails(row.split_details);
  }

  // Split type mismatch detection
  if (result.splitType === "equal" && result.splitDetails.size > 0) {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "SPLIT_TYPE_MISMATCH",
      originalValue: `split_type=${row.split_type}, but split_details provided`,
      fixedValue: "Treating as equal split (ignoring split_details)",
      actionTaken: "Split type is 'equal' but split_details were provided — using equal split, ignoring details",
    });
    result.splitDetails = new Map(); // Clear details for equal split
  }

  if (!result.splitType && !result.isSettlement) {
    anomalies.push({
      rowNumber: row.rowNumber,
      anomalyType: "MISSING_SPLIT_TYPE",
      originalValue: "",
      fixedValue: "equal",
      actionTaken: "Defaulted to equal split",
    });
    result.splitType = "equal";
  }

  // ── 12. Percentage validation ──
  if (result.splitType === "percentage" && result.splitDetails.size > 0) {
    let total = 0;
    result.splitDetails.forEach((v) => (total += v));
    if (Math.abs(total - 100) > 0.01) {
      anomalies.push({
        rowNumber: row.rowNumber,
        anomalyType: "INVALID_PERCENTAGES",
        originalValue: `Percentages sum to ${total}%`,
        fixedValue: `Normalized to 100%`,
        actionTaken: `Percentages summed to ${total}% — normalized proportionally to 100%`,
      });
      // Normalize percentages
      const normalized = new Map<string, number>();
      result.splitDetails.forEach((v, k) => {
        normalized.set(k, (v / total) * 100);
      });
      result.splitDetails = normalized;
    }
  }

  return result;
}

// ──────────────────────────────────────────
// Settlement Detection
// ──────────────────────────────────────────

function detectSettlement(row: ParsedRow, processed: ProcessedRow): boolean {
  const desc = row.description.toLowerCase();
  const notes = row.notes.toLowerCase();

  // Check for settlement keywords
  const settlementKeywords = ["paid", "settlement", "repaid", "paid back", "deposit"];
  const hasKeyword = settlementKeywords.some(
    (kw) => desc.includes(kw) || notes.includes(kw)
  );

  // Check for settlement pattern: no split_type, single recipient in split_with
  const participants = parseSplitWith(row.split_with);
  const noSplitType = !row.split_type.trim();
  const singleRecipient = participants.length === 1;

  // Settlement if: keyword match AND (no split type OR single recipient)
  if (hasKeyword && (noSplitType || singleRecipient)) {
    return true;
  }

  // Also check notes for explicit settlement mention
  if (notes.includes("settlement") || notes.includes("not an expense")) {
    return true;
  }

  return false;
}

// ──────────────────────────────────────────
// Duplicate Detection (Cross-Row)
// ──────────────────────────────────────────

function detectDuplicates(rows: ProcessedRow[], anomalies: Anomaly[]): void {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].skip) continue;
    for (let j = i + 1; j < rows.length; j++) {
      if (rows[j].skip) continue;

      const a = rows[i];
      const b = rows[j];

      // Same date check
      if (a.date.getTime() !== b.date.getTime()) continue;

      // Check for similar descriptions
      const descA = a.description.toLowerCase().replace(/[^a-z0-9]/g, "");
      const descB = b.description.toLowerCase().replace(/[^a-z0-9]/g, "");

      const isSimilar =
        descA === descB ||
        descA.includes(descB) ||
        descB.includes(descA) ||
        computeSimilarity(descA, descB) > 0.6;

      if (!isSimilar) continue;

      // Exact duplicate: same payer, same amount
      if (a.paidBy === b.paidBy && a.amount === b.amount) {
        anomalies.push({
          rowNumber: b.rowNumber,
          anomalyType: "DUPLICATE_EXPENSE",
          originalValue: `Same as row ${a.rowNumber}: "${a.description}" by ${a.paidBy} for ${a.amount}`,
          fixedValue: null,
          actionTaken: `Duplicate of row ${a.rowNumber} — skipping this row`,
        });
        b.skip = true;
        b.skipReason = `Duplicate of row ${a.rowNumber}`;
      }
      // Conflicting duplicate: similar event, different details
      else if (a.paidBy !== b.paidBy || a.amount !== b.amount) {
        anomalies.push({
          rowNumber: a.rowNumber,
          anomalyType: "CONFLICTING_DUPLICATE",
          originalValue: `Row ${a.rowNumber}: "${a.description}" by ${a.paidBy} for ${a.amount}`,
          fixedValue: `Keeping row ${b.rowNumber} instead`,
          actionTaken: `Conflicting with row ${b.rowNumber}: "${b.description}" by ${b.paidBy} for ${b.amount} — keeping row ${b.rowNumber} (per notes suggesting row ${a.rowNumber} is wrong)`,
        });
        a.skip = true;
        a.skipReason = `Conflicting duplicate — row ${b.rowNumber} preferred`;
      }
    }
  }
}

/**
 * Simple similarity score between two strings (Jaccard on character bigrams)
 */
function computeSimilarity(a: string, b: string): number {
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(a.slice(i, i + 2));

  const bigramsB = new Set<string>();
  for (let i = 0; i < b.length - 1; i++) bigramsB.add(b.slice(i, i + 2));

  let intersection = 0;
  bigramsA.forEach((bg) => {
    if (bigramsB.has(bg)) intersection++;
  });

  return intersection / (bigramsA.size + bigramsB.size - intersection);
}