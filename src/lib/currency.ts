// Currency conversion utilities
// Fixed rate — configurable for the app's purposes
export const USD_TO_INR_RATE = 83;

export function convertToINR(amount: number, currency: string): number {
  if (currency === "INR") return amount;
  if (currency === "USD") return amount * USD_TO_INR_RATE;
  // Default: treat as INR
  return amount;
}

export function getConversionNote(currency: string): string | null {
  if (currency === "USD") {
    return `Converted at ₹${USD_TO_INR_RATE} per USD`;
  }
  return null;
}

export const SUPPORTED_CURRENCIES = ["INR", "USD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];
