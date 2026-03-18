import { useRef, type CSSProperties, type ReactNode } from "react";
import Select from "react-select";
import { C } from "../shared/theme";
import { EXP_S, BILL_S, ADV_S, INV_S } from "../shared/constants";
import type { ActivityComment } from "../types";

interface InpOpt {
  v: string;
  l: string;
}

export interface InpProps {
  label?: ReactNode;
  type?: "text" | "number" | "date" | "select" | "textarea" | "email";
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  req?: boolean;
  /** When false, required validation still applies but no asterisk is shown (default true) */
  showReqStar?: boolean;
  min?: string;
  max?: string;
  ph?: string;
  disabled?: boolean;
  opts?: InpOpt[];
  hint?: string;
  style?: CSSProperties;
  endAdornment?: ReactNode;
}

export const Inp: React.FC<InpProps> = ({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  req,
  showReqStar = true,
  min,
  ph,
  disabled,
  opts,
  hint,
  endAdornment,
  style: sx,max
}) => (
  <div style={{ marginBottom: "14px", ...sx }}>
    {label && (
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: 600,
          color: C.primary,
          marginBottom: "4px",
        }}
      >
        {label} {req && showReqStar && <span style={{ color: C.accent }}>*</span>}
      </label>
    )}
    {type === "select" ? (
      <Select
        value={
          opts
            ?.map((o) => ({ value: o.v, label: o.l }))
            .find((o) => o.value === value) ?? null
        }
        onChange={(opt) => {
          const option = opt as { value: string } | null;
          const v = option?.value ?? "";
          const evt = {
            target: { value: v },
          } as React.ChangeEvent<HTMLSelectElement>;
          onChange?.(evt);
        }}
        options={opts?.map((o) => ({ value: o.v, label: o.l })) ?? []}
        isDisabled={disabled}
        isSearchable
        styles={{
          control: (base) => ({
            ...base,
            minHeight: "34px",
            borderRadius: 8,
            borderColor: C.border,
            boxShadow: "none",
            "&:hover": { borderColor: C.border },
            fontSize: 13,
            fontFamily: "'DM Sans'",
          }),
          valueContainer: (base) => ({
            ...base,
            padding: "0 8px",
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: 2000,
          }),
          menu: (base) => ({
            ...base,
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
          }),
          option: (base, state) => ({
            ...base,
            fontSize: 12,
            backgroundColor: state.isSelected
              ? C.surface
              : state.isFocused
              ? "#f1f3f5"
              : "#fff",
            color: "#111827",
          }),
        }}
        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
        menuPosition="fixed"
        menuPlacement="auto"
      />
    ) : type === "textarea" ? (
      <textarea
        value={value}
        onChange={onChange as React.ChangeEventHandler<HTMLTextAreaElement>}
        onBlur={onBlur as React.FocusEventHandler<HTMLTextAreaElement>}
        required={req}
        placeholder={ph}
        disabled={disabled}
        rows={2}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: `1.5px solid ${C.border}`,
          borderRadius: "8px",
          fontSize: "13px",
          fontFamily: "'DM Sans'",
          resize: "vertical",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    ) : (
      <div style={{ position: "relative" }}>
        <input
          type={type === "email" ? "email" : type}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          onBlur={onBlur as React.FocusEventHandler<HTMLInputElement>}
          required={req}
          min={min}
          max={max}
          placeholder={ph}
          disabled={disabled}
          style={{
            width: "100%",
            padding: endAdornment ? "8px 40px 8px 12px" : "8px 12px",
            border: `1.5px solid ${C.border}`,
            borderRadius: "8px",
            fontSize: "13px",
            fontFamily: "'DM Sans'",
            outline: "none",
            boxSizing: "border-box",
            background: disabled ? C.surface : "#fff",
          }}
        />
        {endAdornment && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "12px",
              transform: "translateY(-50%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {endAdornment}
          </div>
        )}
      </div>
    )}
    {hint && (
      <div style={{ fontSize: "11px", color: C.muted, marginTop: "3px" }}>{hint}</div>
    )}
  </div>
);

export const Alert: React.FC<{
  children: ReactNode;
  sx?: CSSProperties;
}> = ({ children, sx }) => (
  <div
    style={{
      padding: "10px 14px",
      background: C.dangerBg,
      color: C.danger,
      borderRadius: "8px",
      fontSize: "12px",
      border: `1px solid ${C.danger}22`,
      ...sx,
    }}
  >
    {children}
  </div>
);

const _b: Record<string, [string, string]> = {};
[
  [EXP_S.PENDING, C.warningBg, C.warning],
  [EXP_S.APPROVED, C.successBg, C.success],
  [EXP_S.REJECTED, C.dangerBg, C.danger],
  [EXP_S.CANCELLED, "#F1EFE8", "#5F5E5A"],
  [EXP_S.AWAITING_BILL, "#FFF7ED", "#C2410C"],
  [EXP_S.COMPLETED, "#ECFDF5", "#065F46"],
  [BILL_S.SUBMITTED, C.warningBg, C.warning],
  [BILL_S.APPROVED, C.successBg, C.success],
  [BILL_S.REJECTED, C.dangerBg, C.danger],
  [BILL_S.PAID, C.infoBg, C.info],
  [BILL_S.OVERDUE, "#FEE2E2", "#991B1B"],
  [ADV_S.PENDING, C.warningBg, C.warning],
  [ADV_S.APPROVED, C.successBg, C.success],
  [ADV_S.REJECTED, C.dangerBg, C.danger],
  [ADV_S.DISBURSED, C.advanceBg, C.advance],
  [INV_S.DRAFT, "#F1EFE8", "#5F5E5A"],
  [INV_S.SENT, C.infoBg, C.info],
  [INV_S.VIEWED, "#EDE9FE", "#6C3FA0"],
  [INV_S.PAID, C.successBg, C.success],
  [INV_S.PARTIALLY_PAID, C.invoiceBg, C.invoice],
  [INV_S.OVERDUE, "#FEE2E2", "#991B1B"],
].forEach(([k, bg, fg]) => { _b[k as string] = [bg as string, fg as string]; });
const BADGE_MAP = _b;

export const Badge: React.FC<{ s: string }> = ({ s }) => {
  const [bg, fg] = BADGE_MAP[s] || ["#eee", "#666"];
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "10px",
        fontWeight: 600,
        background: bg,
        color: fg,
        whiteSpace: "nowrap",
      }}
    >
      {s}
    </span>
  );
};

export const Btn: React.FC<{
  children: ReactNode;
  onClick?: () => void;
  v?: "primary" | "secondary" | "success" | "danger" | "ghost" | "vendor" | "advance" | "info" | "invoice";
  disabled?: boolean;
  sm?: boolean;
  sx?: CSSProperties;
}> = ({ children, onClick, v = "primary", disabled, sm, sx }) => {
  const vs: Record<string, CSSProperties> = {
    primary: { background: C.accent, color: "#fff" },
    secondary: { background: C.surface, color: C.primary, border: `1.5px solid ${C.border}` },
    success: { background: C.success, color: "#fff" },
    danger: { background: C.danger, color: "#fff" },
    ghost: { background: "transparent", color: C.muted },
    vendor: { background: C.vendor, color: "#fff" },
    advance: { background: C.advance, color: "#fff" },
    info: { background: C.info, color: "#fff" },
    invoice: { background: C.invoice, color: "#fff" },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: sm ? "6px 12px" : "8px 18px",
        borderRadius: "8px",
        fontSize: sm ? "11px" : "12px",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        border: "none",
        transition: "all 0.2s",
        fontFamily: "'DM Sans'",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        ...vs[v],
        ...sx,
      }}
    >
      {children}
    </button>
  );
};

export const Av: React.FC<{ n?: string; sz?: number; v?: boolean }> = ({ n, sz = 32, v }) => {
  const i = n?.split(" ").map((x) => x[0]).join("").slice(0, 2) || "?";
  return (
    <div
      style={{
        width: sz,
        height: sz,
        borderRadius: v ? "8px" : "50%",
        background: v
          ? `linear-gradient(135deg,${C.vendor},${C.vendorL})`
          : `linear-gradient(135deg,${C.primary},${C.accent})`,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: sz * 0.35,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {i}
    </div>
  );
};

export const Mdl: React.FC<{
  open: boolean;
  close: () => void;
  title: string;
  w?: boolean;
  children: ReactNode;
}> = ({ open, close, title, w, children }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(27,42,74,0.4)",
          backdropFilter: "blur(3px)",
        }}
      />
      <style>{`
        .app-modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: ${C.border} transparent;
        }
        .app-modal-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .app-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .app-modal-scroll::-webkit-scrollbar-thumb {
          background: ${C.border};
          border-radius: 999px;
        }
        .app-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: ${C.muted};
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        className="app-modal-scroll"
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: w ? "760px" : "500px",
          maxHeight: "88vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(27,42,74,0.18)",
        }}
      >
        <div
          style={{
            padding: "16px 24px 12px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            background: "#fff",
            borderRadius: "14px 14px 0 0",
            zIndex: 10,
          }}
        >
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: C.primary }}>{title}</h2>
          <button
            onClick={close}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              color: C.muted,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "16px 24px 20px", position: "relative", zIndex: 1 }}>{children}</div>
      </div>
    </div>
  );
};

export const Stat: React.FC<{ label: string; value: ReactNode }> = ({ label, value }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: "12px",
      padding: "14px 16px",
      border: `1px solid ${C.border}`,
      flex: "1",
      minWidth: "120px",
    }}
  >
    <div
      style={{
        fontSize: "10px",
        color: C.muted,
        marginBottom: "3px",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: "20px", fontWeight: 700, color: C.primary }}>{value}</div>
  </div>
);

export const Empty: React.FC<{ icon: string; title: string; sub: string }> = ({ icon, title, sub }) => (
  <div style={{ textAlign: "center", padding: "40px 16px", color: C.muted }}>
    <div style={{ fontSize: "36px", marginBottom: "8px", opacity: 0.35 }}>{icon}</div>
    <div style={{ fontSize: "14px", fontWeight: 600, color: C.primary, marginBottom: "3px" }}>{title}</div>
    <div style={{ fontSize: "12px" }}>{sub}</div>
  </div>
);

export const FileUp: React.FC<{
  file: { n: string; s: string } | null;
  onChange: (f: { n: string; s: string } | null) => void;
  req?: boolean;
  title?:string;
  /** Optional: pass the raw File for FormData uploads */
  onFileSelect?: (f: File | null) => void;
  /** e.g. ".pdf" for PDF only */
  accept?: string;
  /** Override hint text below drop zone */
  hint?: string;
}> = ({ file, onChange, req, onFileSelect, accept = ".pdf,.jpg,.jpeg,.png", hint , title = "Attachment"}) => {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (f: File) => {
    onChange({ n: f.name, s: (f.size / 1024).toFixed(0) + " KB" });
    onFileSelect?.(f);
  };
  const handleClear = () => {
    onChange(null);
    onFileSelect?.(null);
    if (ref.current) ref.current.value = "";
  };
  const hintText = hint ?? (accept === ".pdf" ? "PDF only" : "PDF, JPG, PNG up to 10 MB");
  return (
    <div style={{ marginBottom: "14px" }}>
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: 600,
          color: C.primary,
          marginBottom: "4px",
        }}
      >
        {title} {req && <span style={{ color: C.accent }}>*</span>}
      </label>
      {file ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            background: C.vendorBg,
            borderRadius: "8px",
            border: `1px solid ${C.vendor}25`,
          }}
        >
          <span>📎</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: 600 }}>{file.n}</div>
            <div style={{ fontSize: "10px", color: C.muted }}>{file.s}</div>
          </div>
          <button type="button" onClick={handleClear} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, fontSize: "13px" }}>✕</button>
        </div>
      ) : (
        <div
          onClick={() => ref.current?.click()}
          style={{
            padding: "20px",
            border: `2px dashed ${C.border}`,
            borderRadius: "8px",
            textAlign: "center",
            cursor: "pointer",
            background: C.surface,
          }}
        >
          <div style={{ fontSize: "24px", opacity: 0.3, marginBottom: "4px" }}>📄</div>
          <div style={{ fontSize: "12px", fontWeight: 600 }}>
            Drop file or <span style={{ color: C.vendor }}>browse</span>
          </div>
          <div style={{ fontSize: "10px", color: C.muted }}>{hintText}</div>
          <input
            ref={ref}
            type="file"
            accept={accept}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            style={{ display: "none" }}
          />
        </div>
      )}
    </div>
  );
};

export const Toggle: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
  <label
    style={{
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.6 : 1,
      pointerEvents: disabled ? "none" : "auto",
    }}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
    />
    <span
      style={{
        width: 34,
        height: 18,
        borderRadius: 999,
        background: checked ? C.invoice : C.border,
        position: "relative",
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 18 : 2,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(15,23,42,0.25)",
          transition: "left 0.15s",
        }}
      />
    </span>
  </label>
);

interface TableRow {
  _cells: { v: ReactNode; sx?: CSSProperties }[];
}

export const Tbl: React.FC<{
  cols: (string | boolean)[];
  rows: TableRow[];
  onRow?: (row: TableRow) => void;
}> = ({ cols, rows, onRow }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "12px" }}>
      <thead>
        <tr>
          {cols.filter(Boolean).map((h) => (
            <th
              key={String(h)}
              style={{
                padding: "8px 12px",
                textAlign: "left",
                fontSize: "10px",
                fontWeight: 600,
                color: C.muted,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                borderBottom: `2px solid ${C.border}`,
                whiteSpace: "nowrap",
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            onClick={() => onRow?.(row)}
            style={{ cursor: onRow ? "pointer" : "default", transition: "background 0.15s" }}
            onMouseOver={(e) => (e.currentTarget.style.background = C.surface)}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {row._cells.map((c, j) => (
              <td key={j} style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, ...c.sx }}>
                {c.v}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const Filter: React.FC<{
  search: string;
  onSearch: (v: string) => void;
  status: string;
  onStatus: (s: string) => void;
  opts: string[];
}> = ({ search, onSearch, status, onStatus, opts }) => (
  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", marginBottom: "14px" }}>
    <div style={{ position: "relative", flex: "1", minWidth: "160px", maxWidth: "260px" }}>
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search..."
        style={{
          width: "100%",
          padding: "7px 12px 7px 30px",
          border: `1.5px solid ${C.border}`,
          borderRadius: "8px",
          fontSize: "12px",
          fontFamily: "'DM Sans'",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: C.muted }}>⌕</span>
    </div>
    <div
      style={{
        display: "flex",
        gap: "2px",
        background: C.surface,
        borderRadius: "8px",
        padding: "2px",
        minHeight: "34px",
        alignItems: "center",
      }}
    >
      {opts.map((s) => (
        <button
          key={s}
          onClick={() => onStatus(s)}
          style={{
            minHeight: "30px",
            padding: "6px 10px",
            borderRadius: "6px",
            border: "none",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Sans'",
            background: status === s ? "#fff" : "transparent",
            color: status === s ? C.primary : C.muted,
            boxShadow: status === s ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
          }}
        >
          {s === "all" ? "All" : s}
        </button>
      ))}
    </div>
  </div>
);

export const CLog: React.FC<{ comments: ActivityComment[] }> = ({ comments }) =>
  comments?.length > 0 ? (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontSize: "10px", color: C.muted, marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Activity
      </div>
      {comments.map((c, i) => (
        <div
          key={i}
          style={{
            padding: "8px 12px",
            background: C.surface,
            borderRadius: "6px",
            borderLeft: `3px solid ${c.t === "pay" ? C.info : c.t === "ok" ? C.success : c.t === "no" ? C.danger : C.accent}`,
            marginBottom: "4px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", fontWeight: 600 }}>{c.by}</span>
            <span style={{ fontSize: "10px", color: C.muted }}>{c.d}</span>
          </div>
          <div style={{ fontSize: "11px", color: C.muted }}>{c.text}</div>
        </div>
      ))}
    </div>
  ) : null;

export const EmailBanner: React.FC<{ to: string; cc?: string; subj: string }> = ({ to, cc, subj }) => (
  <div
    style={{
      padding: "10px 14px",
      background: "#F0FDF4",
      borderRadius: "8px",
      border: "1px solid #BBF7D0",
      marginBottom: "12px",
      fontSize: "11px",
    }}
  >
    <div style={{ fontWeight: 600, color: C.success, marginBottom: "4px" }}>✉ Email notification</div>
    <div><span style={{ color: C.muted }}>To:</span> {to}</div>
    {cc && <div><span style={{ color: C.muted }}>CC:</span> {cc}</div>}
    <div><span style={{ color: C.muted }}>Subject:</span> {subj}</div>
  </div>
);
