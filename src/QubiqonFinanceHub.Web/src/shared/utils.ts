import { CURRENCIES } from "./constants";

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
