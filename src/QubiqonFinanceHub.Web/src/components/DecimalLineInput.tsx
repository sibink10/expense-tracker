import { useState, type CSSProperties } from "react";
import { C } from "../shared/theme";
import { fmtQty, round2 } from "../shared/utils";

type Props = {
  value: number;
  onChange: (v: number) => void;
  /** Values below this are raised on blur (default 0). */
  min?: number;
  /** When the field is left blank on blur (default: min if set, else 0). */
  emptyFallback?: number;
  textAlign?: "center" | "right";
  style?: CSSProperties;
};

/**
 * Text input for line-item quantity or rate: shows two decimals when unfocused (e.g. 1.00, 0.00).
 */
export default function DecimalLineInput({
  value,
  onChange,
  min = 0,
  emptyFallback,
  textAlign = "right",
  style,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const display = focused && draft !== null ? draft : fmtQty(value);

  const commitRaw = (raw: string) => {
    const t = raw.replace(/,/g, "").trim();
    let v = parseFloat(t);
    if (!Number.isFinite(v)) {
      const fb = emptyFallback !== undefined ? emptyFallback : min;
      onChange(round2(fb));
      return;
    }
    v = round2(v);
    if (v < min) v = min;
    onChange(v);
  };

  const base: CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    border: `1px solid ${C.border}`,
    borderRadius: "6px",
    fontSize: "12px",
    lineHeight: "1.25",
    textAlign,
    boxSizing: "border-box",
    ...style,
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={display}
      onFocus={() => {
        setFocused(true);
        setDraft(fmtQty(value));
      }}
      onBlur={() => {
        setFocused(false);
        const raw = (draft ?? "").trim();
        if (raw === "" || raw === "." || raw === "-") {
          const fb = emptyFallback !== undefined ? emptyFallback : min;
          onChange(round2(fb));
        } else {
          commitRaw(raw);
        }
        setDraft(null);
      }}
      onChange={(e) => {
        const t = e.target.value;
        setDraft(t);
        if (t.trim() === "" || t === "." || t === "-") return;
        const v = parseFloat(t.replace(/,/g, ""));
        if (Number.isFinite(v)) onChange(v);
      }}
      style={base}
    />
  );
}
