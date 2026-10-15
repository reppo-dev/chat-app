import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";
import {
  NullableDateValue,
  NullableMediaValue,
  NullableStringValue,
} from "./types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Safely extracts a clean string from either a plain string or a Go sql.NullString / pqtype.NullRawMessage object.
 */
export function extractNullableString(
  val: NullableStringValue | NullableMediaValue | unknown
): string {
  if (!val) return "";
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (obj.Valid === false) return "";
    if (typeof obj.String === "string") return obj.String;
    if (typeof obj.RawMessage === "string") return obj.RawMessage;
    return "";
  }
  if (typeof val === "string") return val;
  return String(val);
}

/**
 * Safely parses any date value (including Go sql.NullTime { Time, Valid }, Go zero dates, or ISO strings).
 * Returns a valid Date object or null.
 */
export function extractNullableDate(
  val: NullableDateValue | unknown
): Date | null {
  if (!val) return null;

  let dateStr: string | null = null;
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (obj.Valid === false) return null;
    if (typeof obj.Time === "string") dateStr = obj.Time;
    else if (typeof obj.String === "string") dateStr = obj.String;
  } else if (typeof val === "string") {
    dateStr = val;
  }

  if (!dateStr || dateStr.trim() === "") return null;

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;

  // Filter out Go's zero-value timestamps (e.g. 0001-01-01)
  if (d.getFullYear() <= 1) return null;

  return d;
}

/**
 * Formats a date value into YYYY-MM-DD for HTML input[type="date"].
 */
export function formatDateForInput(val: NullableDateValue | unknown): string {
  const d = extractNullableDate(val);
  if (!d) return "";
  try {
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

/**
 * Formats a date value into a human-readable string.
 */
export function formatDisplayDate(val: NullableDateValue | unknown): string {
  const d = extractNullableDate(val);
  if (!d) return "";
  return d.toLocaleDateString();
}

/**
 * Safely extracts user-friendly error message from any caught error.
 */
export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = "An unexpected error occurred"
): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallbackMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallbackMessage;
}
