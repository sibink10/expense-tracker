import { isValidPhoneNumber, parsePhoneNumber, getCountryCallingCode } from "libphonenumber-js/min";
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

/**
 * `react-phone-number-input` (international mode) often replaces the field with only the new
 * country calling code when the flag changes. Detect that so we can restore national digits.
 */
export function isLikelyCountryPrefixWipe(prev: string | undefined, next: string | undefined): boolean {
  if (!prev?.trim() || !next?.trim()) return false;
  const dPrev = prev.replace(/\D/g, "");
  const dNext = next.replace(/\D/g, "");
  if (dPrev.length < 7) return false;
  if (dNext.length === 0 || dNext.length >= dPrev.length) return false;
  if (dNext.length > 6) return false;
  return true;
}

/** Keep national significant digits from the previous E.164 and prepend the new country's calling code. */
export function rebuildE164PreservingNationalDigits(prevE164: string, newCountry: Country): string {
  try {
    const prevParsed = parsePhoneNumber(prevE164);
    if (!prevParsed) return prevE164;
    const nationalDigits = String(prevParsed.nationalNumber);
    if (!nationalDigits) return prevE164;
    const cc = getCountryCallingCode(newCountry);
    return `+${cc}${nationalDigits}`;
  } catch {
    return prevE164;
  }
}
