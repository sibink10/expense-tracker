import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js/min";
import type { Country } from "react-phone-number-input";

/** Convert stored phone (E.164 or national digits) to E.164 for `react-phone-number-input` `value`. */
export function normalizeStoredPhone(
  raw: string | undefined,
  defaultCountry: Country = "IN"
): string | undefined {
  if (!raw?.trim()) return undefined;
  const t = raw.trim();
  if (t.startsWith("+")) {
    try {
      const n = parsePhoneNumber(t);
      return n?.format("E.164");
    } catch {
      return t;
    }
  }
  try {
    const n = parsePhoneNumber(t, defaultCountry);
    return n.format("E.164");
  } catch {
    return undefined;
  }
}

/** Per-country validation (libphonenumber rules). */
export function isPhoneValidE164(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  return isValidPhoneNumber(value.trim());
}

/** Optional field: empty is ok; otherwise must be valid for selected country. */
export function isOptionalPhoneValid(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  return isValidPhoneNumber(value.trim());
}
