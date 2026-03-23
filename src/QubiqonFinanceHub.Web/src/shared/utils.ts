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

/** Calendar days past due (local date). Returns null if not past due or unparseable. */
/** Toggle or set server sort (matches API `FilterParams.SortBy` / `Desc`). */
export function nextListSort(
  clickedKey: string,
  currentKey: string,
  currentDesc: boolean
): { sortBy: string; desc: boolean } {
  if (currentKey === clickedKey) return { sortBy: clickedKey, desc: !currentDesc };
  return { sortBy: clickedKey, desc: true };
}

export function daysOverdueFromDueYmd(dueYmd: string | undefined | null): number | null {
  if (!dueYmd?.trim()) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dueYmd.trim());
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const d = parseInt(m[3], 10);
  const due = new Date(y, mo, d);
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = t0.getTime() - due.getTime();
  if (diffMs <= 0) return null;
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * Download a file from a SAS/signed URL via fetch → arrayBuffer → blob.
 * Use when the API returns a SAS URL and you need to trigger a browser download.
 */
export async function downloadFromSasUrl(
  sasUrl: string,
  filename: string,
  onError?: () => void
): Promise<void> {
  try {
    const response = await fetch(sasUrl, { method: "GET", mode: "cors" });
    if (!response.ok) throw new Error("Fetch failed");
    const arrayBuffer = await response.arrayBuffer();
    const blob = new Blob([arrayBuffer], {
      type: response.headers.get("content-type") || "application/octet-stream",
    });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    onError?.();
  }
}

export function buildDownloadFilename(
  baseName: string,
  sourceName?: string | null,
  fallbackExt = ".pdf"
): string {
  const safeBase = (baseName || "download").replace(/[<>:"/\\|?*\u0000-\u001F]+/g, "-").trim() || "download";
  const extMatch = sourceName?.match(/(\.[a-zA-Z0-9]+)(?:$|\?)/);
  const ext = extMatch?.[1] || fallbackExt;
  return `${safeBase}${ext.startsWith(".") ? ext : `.${ext}`}`;
}

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

/** Round to 2 decimal places (money / qty). */
export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Qty or unit rate display: always two decimals (e.g. 1.00, 0.00). */
export function fmtQty(n: number): string {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0.00";
  return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** TDS select option: omits "— section" when section is missing (avoids "— null"). */
export function formatTdsOptionLabel(name: string, rate: number, section?: string | null): string {
  const sec = section?.trim();
  return sec ? `${name} (${rate}%) — ${sec}` : `${name} (${rate}%)`;
}

/** TDS summary in parentheses, e.g. "194J @ 20%" or "20%" when no section. */
export function formatTdsSummarySnippet(section: string | null | undefined, rate: number): string {
  const sec = section?.trim();
  return sec ? `${sec} @ ${rate}%` : `${rate}%`;
}

/** Bill detail line: "(section — name)" with null-safe parts. */
export function formatTdsDetailParen(section: string | null | undefined, name: string | null | undefined): string {
  const parts = [section?.trim(), name?.trim()].filter(Boolean) as string[];
  return parts.length ? `(${parts.join(" — ")})` : "";
}

/** One summary row per line that has GST selected (two lines → two rows, even if same tax). */
export type LineGstRow = { id: string; label: string; amount: number };

export function aggregateLineGstRows(
  items: Array<{ quantity: number; rate: number; gstConfigId?: string | null; description?: string }>,
  gstConfigs: Array<{ id: string; name: string; rate: number }>
): LineGstRow[] {
  const rows: LineGstRow[] = [];
  items.forEach((it, idx) => {
    const gid = it.gstConfigId?.trim();
    if (!gid) return;
    const g = gstConfigs.find((x) => x.id === gid);
    if (!g) return;
    const lineAmt = it.quantity * it.rate;
    const tax = round2((lineAmt * g.rate) / 100);
    const desc = it.description?.trim();
    const suffix = desc
      ? ` · ${desc.length > 42 ? `${desc.slice(0, 42)}…` : desc}`
      : ` · #${idx + 1}`;
    rows.push({
      id: `gst-line-${idx}`,
      label: `${g.name} (${g.rate}%)${suffix}`,
      amount: tax,
    });
  });
  return rows;
}
