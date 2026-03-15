import { CURRENCIES } from "./constants";

/** Email regex for validation (single address). */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns true if the string is a valid email (empty string is invalid; use isEmailValidOrEmpty for optional fields). */
export function isEmailValid(email: string): boolean {
  return email.trim() !== "" && EMAIL_REGEX.test(email.trim());
}

/** Returns true if the string is empty or a valid email. */
export function isEmailValidOrEmpty(email: string): boolean {
  const t = email.trim();
  return t === "" || EMAIL_REGEX.test(t);
}

/** Validates comma-separated email list; returns true if every non-empty part is a valid email. */
export function isEmailListValid(list: string): boolean {
  const parts = list.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.every((part) => EMAIL_REGEX.test(part));
}

export const genCode = (fmt: string, seq: number, type = "SEZ"): string => {
  const d = new Date();
  const y = d.getFullYear();
  const yy = String(y).slice(2);
  const yy1 = String(y + (d.getMonth() >= 3 ? 1 : 0)).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  let c = fmt
    .replace("{YYYY}", String(y))
    .replace("{YY}", yy)
    .replace("{YY+1}", yy1)
    .replace("{YYMM}", yy + mm)
    .replace("{TYPE}", type);
  const m = c.match(/\{SEQ:(\d+)\}/);
  if (m) c = c.replace(m[0], String(seq).padStart(parseInt(m[1]), "0"));
  return c;
};

export const addDays = (ds: string, n: number): string => {
  const d = new Date(ds);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

export const fmtCur = (a: number | string, cur = "INR"): string => {
  const s = CURRENCIES.find((c) => c.v === cur)?.s || "₹";
  return (
    s +
    Number(a).toLocaleString(cur === "INR" ? "en-IN" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};
