import { useRef, type CSSProperties, type ReactNode } from "react";
import { FileText, Paperclip, UploadCloud, X } from "lucide-react";
import Select from "react-select";
import { C, R } from "../shared/theme";
import { EXP_S, BILL_S, ADV_S, INV_S } from "../shared/constants";
import { activityCommentStatusFallback } from "../shared/activityCommentStatus";
import type { ActivityComment } from "../types";
import { EditIcon, TrashIcon } from "./icons";
import { OverflowStatusTabs } from "./list-toolbar";

function activityStatusPillColors(t: ActivityComment["t"]): { color: string; background: string } {
  switch (t) {
    case "ok":
      return { color: C.success, background: C.successBg };
    case "no":
      return { color: C.danger, background: C.dangerBg };
    case "pay":
      return { color: C.info, background: C.infoBg };
    default:
      return { color: C.accent, background: "rgba(232, 89, 60, 0.12)" };
  }
}

interface InpOpt {
  v: string;
  l: string;
}

export interface InpProps {
  label?: ReactNode;
  type?: "text" | "number" | "date" | "select" | "textarea" | "email" | "password";
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
  controlSx?: CSSProperties;
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
  style: sx,
  controlSx,
  max
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
            fontFamily: "'Inter', 'Manrope', sans-serif",
            ...controlSx,
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
          fontFamily: "'Inter', 'Manrope', sans-serif",
          resize: "vertical",
          outline: "none",
          boxSizing: "border-box",
          ...controlSx,
        }}
      />
    ) : (
      <div style={{ position: "relative" }}>
        <input
          type={type === "email" ? "email" : type}
          value={value}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          onClick={(e) => {
            if (type === "date" && !disabled) {
              const input = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
              input.showPicker?.();
            }
          }}
          onBlur={onBlur as React.FocusEventHandler<HTMLInputElement>}
          required={req}
          min={type === "password" ? undefined : min}
          max={type === "password" ? undefined : max}
          placeholder={ph}
          disabled={disabled}
          autoComplete={type === "password" ? "off" : undefined}
          inputMode={type === "password" ? "numeric" : undefined}
          spellCheck={type === "password" ? false : undefined}
          style={{
            width: "100%",
            padding: endAdornment ? "8px 40px 8px 12px" : "8px 12px",
            border: `1.5px solid ${C.border}`,
            borderRadius: "8px",
            fontSize: "13px",
            fontFamily: "'Inter', 'Manrope', sans-serif",
            outline: "none",
            boxSizing: "border-box",
            background: disabled ? C.surface : "#fff",
            ...controlSx,
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
  [EXP_S.AWAITING_PAYMENT, C.infoBg, C.info],
  [EXP_S.REJECTED, C.dangerBg, C.danger],
  [EXP_S.CANCELLED, "#F1EFE8", "#5F5E5A"],
  [EXP_S.AWAITING_BILL, "#FFF7ED", "#C2410C"],
  [EXP_S.COMPLETED, "#ECFDF5", "#065F46"],
  [EXP_S.PARTIALLY_PAID, "#ECFDF5", "#065F46"],
  [BILL_S.SUBMITTED, C.warningBg, C.warning],
  [BILL_S.APPROVED, C.successBg, C.success],
  [BILL_S.REJECTED, C.dangerBg, C.danger],
  [BILL_S.PAID, C.infoBg, C.info],
  [BILL_S.PARTIALLY_PAID, C.infoBg, C.info],
  [BILL_S.OVERDUE, "#FEE2E2", "#991B1B"],
  [ADV_S.PENDING, C.warningBg, C.warning],
  [ADV_S.APPROVED, C.successBg, C.success],
  [ADV_S.REJECTED, C.dangerBg, C.danger],
  [ADV_S.DISBURSED, C.advanceBg, C.advance],
  [ADV_S.SETTLED, C.advanceBg, C.advance],
  [ADV_S.PARTIALLY_DISBURSED, C.advanceBg, C.advance],
  [ADV_S.CANCELLED, "#F1EFE8", "#5F5E5A"],
  [INV_S.DRAFT, "#F1EFE8", "#5F5E5A"],
  [INV_S.SENT, C.infoBg, C.info],
  [INV_S.VIEWED, "#EDE9FE", "#6C3FA0"],
  [INV_S.PAID, C.successBg, C.success],
  [INV_S.PARTIALLY_PAID, C.invoiceBg, C.invoice],
  [INV_S.OVERDUE, "#FEE2E2", "#991B1B"],
  [INV_S.PENDING_SIGNATURE, "#E0F2FE", "#0369A1"],
  [INV_S.SIGNED, "#DCFCE7", "#166534"],
  [INV_S.SIGNATURE_FAILED, "#FEE2E2", "#991B1B"],
].forEach(([k, bg, fg]) => { _b[k as string] = [bg as string, fg as string]; });
const BADGE_MAP = _b;
const BADGE_LABELS: Record<string, string> = {
  [INV_S.PENDING_SIGNATURE]: "Pending Signature",
  [INV_S.SIGNATURE_FAILED]: "Signature Failed",
};

const OVERDUE_BADGE_STYLE: [string, string] = ["#FEE2E2", "#991B1B"];

function formatOverdueDaysPhrase(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

function buildBadgeTooltip(
  s: string,
  displayStatus: string,
  forceDanger: boolean,
  overdueDays: number | null | undefined,
  titleOverride?: string,
): string | undefined {
  if (titleOverride) return titleOverride;

  if (forceDanger) {
    const daysPart =
      overdueDays != null && overdueDays >= 1
        ? ` by ${formatOverdueDaysPhrase(overdueDays)}`
        : "";
    return `Past due${daysPart}. Invoice has not been sent to the client — status remains ${displayStatus}.`;
  }

  if (
    (s === INV_S.OVERDUE || s === BILL_S.OVERDUE) &&
    overdueDays != null &&
    overdueDays >= 1
  ) {
    return `Overdue by ${formatOverdueDaysPhrase(overdueDays)}.`;
  }

  return undefined;
}

export const Badge: React.FC<{
  s: string;
  overdueDays?: number | null;
  /** Light-danger background + danger text while keeping status label (e.g. Draft past due). */
  forceDanger?: boolean;
  /** Native hover tooltip; auto-generated for overdue / past-due-not-sent when omitted. */
  title?: string;
}> = ({ s, overdueDays, forceDanger = false, title: titleOverride }) => {
  const [bg, fg] = forceDanger ? OVERDUE_BADGE_STYLE : BADGE_MAP[s] || ["#eee", "#666"];
  const displayStatus = BADGE_LABELS[s] ?? s;
  const showOverdueDays =
    !forceDanger &&
    (s === INV_S.OVERDUE || s === BILL_S.OVERDUE) &&
    overdueDays != null &&
    overdueDays >= 1;
  const label = showOverdueDays
    ? `${displayStatus} · ${overdueDays} ${overdueDays === 1 ? "day" : "days"}`
    : displayStatus;
  const tooltip = buildBadgeTooltip(s, displayStatus, forceDanger, overdueDays, titleOverride);

  return (
    <span
      title={tooltip}
      style={{
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "10px",
        fontWeight: 600,
        background: bg,
        color: fg,
        whiteSpace: "nowrap",
        cursor: tooltip ? "help" : undefined,
      }}
    >
      {label}
    </span>
  );
};

export const Btn: React.FC<{
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  v?: "primary" | "secondary" | "success" | "danger" | "ghost" | "vendor" | "advance" | "info" | "invoice";
  disabled?: boolean;
  sm?: boolean;
  sx?: CSSProperties;
  /** Native tooltip; when `disabled`, wrapped so the tooltip still shows on hover */
  title?: string;
}> = ({ children, onClick, v = "primary", disabled, sm, sx, title }) => {
  const vs: Record<string, CSSProperties> = {
    primary: { background: C.accent, color: "#fff" },
    secondary: { background: C.surface, color: C.primary, border: `1.5px solid ${C.border}` },
    success: { background: C.success, color: "#fff" },
    danger: { background: C.danger, color: "#fff" },
    ghost: { background: "transparent", color: C.muted },
    vendor: { background: C.accent, color: "#fff" },
    advance: { background: C.accent, color: "#fff" },
    info: { background: C.accent, color: "#fff" },
    invoice: { background: C.accent, color: "#fff" },
  };
  const buttonStyle: CSSProperties = {
    padding: sm ? "6px 12px" : "8px 18px",
    borderRadius: R.control,
    fontSize: sm ? "11px" : "12px",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    transition: "all 0.2s",
    fontFamily: "'Inter', 'Manrope', sans-serif",
    opacity: disabled ? 0.5 : 1,
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    ...vs[v],
    ...sx,
  };
  const buttonEl = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? undefined : title}
      style={buttonStyle}
    >
      {children}
    </button>
  );
  if (disabled && title) {
    return (
      <span title={title} style={{ display: "inline-flex", cursor: "not-allowed" }}>
        {buttonEl}
      </span>
    );
  }
  return buttonEl;
};

/** Secondary action for list pages — place on the right; calls the page’s GET again via `onRefresh`. */
export const ListRefreshButton: React.FC<{
  onRefresh: () => void;
  loading?: boolean;
}> = ({ onRefresh, loading }) => (
  <span title="Refresh list">
    <Btn sm v="secondary" onClick={onRefresh} disabled={loading}>
      {loading ? "…" : "↻ Refresh"}
    </Btn>
  </span>
);

export const IconActionButton: React.FC<{
  label: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  children: ReactNode;
  sx?: CSSProperties;
}> = ({ label, onClick, disabled, children, sx }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    disabled={disabled}
    style={{
      width: 24,
      height: 24,
      border: "none",
      borderRadius: "4px",
      background: "transparent",
      color: C.muted,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      ...sx,
    }}
  >
    {children}
  </button>
);

export const EditActionButton: React.FC<{
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  sx?: CSSProperties;
}> = ({ onClick, disabled, sx }) => (
  <IconActionButton label="Edit" onClick={onClick} disabled={disabled} sx={sx}>
    <EditIcon size={19} color={C.actionEditIcon} />
  </IconActionButton>
);

export const DeleteActionButton: React.FC<{
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  sx?: CSSProperties;
}> = ({ onClick, disabled, sx }) => (
  <IconActionButton label="Delete" onClick={onClick} disabled={disabled} sx={sx}>
    <TrashIcon size={17} color={C.actionDangerIcon} />
  </IconActionButton>
);

export const Av: React.FC<{ n?: string; sz?: number; v?: boolean; bg?: string; color?: string }> = ({
  n,
  sz = 32,
  v,
  bg,
  color,
}) => {
  const i = n?.split(" ").map((x) => x[0]).join("").slice(0, 2) || "?";
  return (
    <div
      style={{
        width: sz,
        height: sz,
        borderRadius: v ? "8px" : "50%",
        background: bg ?? (v
          ? `linear-gradient(135deg,${C.vendor},${C.vendorL})`
          : `linear-gradient(135deg,${C.primary},${C.accent})`),
        color: color ?? C.white,
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

export const MODAL_Z_INDEX = 900;
export const INVOICE_MODAL_Z_INDEX = 1000;

export const Mdl: React.FC<{
  open: boolean;
  close: () => void;
  title: string;
  w?: boolean;
  /** Custom max width (e.g. "960px") for larger modals */
  maxWidth?: string;
  zIndex?: number;
  children: ReactNode;
}> = ({ open, close, title, w, maxWidth, zIndex = MODAL_Z_INDEX, children }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
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
          scrollbar-color: ${C.surface} transparent;
        }
        .app-modal-scroll::-webkit-scrollbar {
          width: 2px;
          height: 2px;
        }
        .app-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .app-modal-scroll::-webkit-scrollbar-thumb {
          background: ${C.surface};
          border-radius: 1px;
        }
        .app-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: ${C.border};
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: "14px",
          width: "100%",
          maxWidth: maxWidth ?? (w ? "760px" : "500px"),
          maxHeight: "88vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
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
            zIndex: 0,
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
        <div
          className="app-modal-scroll"
          style={{
            padding: "16px 24px 20px",
            position: "relative",
            zIndex: 0,
            overflow: "auto",
            flex: 1,
            minHeight: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export const Stat: React.FC<{ label: string; value: ReactNode }> = ({ label, value }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: "4px",
      padding: "14px 16px",
      flex: "1",
      minWidth: "120px",
      boxShadow: "0px 2px 3px 0px #253EA70A",

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

export const Empty: React.FC<{ icon: ReactNode; title: string; sub: string }> = ({ icon, title, sub }) => (
  <div style={{ textAlign: "center", padding: "40px 16px", color: C.muted }}>
    <div style={{ fontSize: "36px", marginBottom: "8px", opacity: 0.35, display: "inline-flex" }}>{icon}</div>
    <div style={{ fontSize: "14px", fontWeight: 600, color: C.primary, marginBottom: "3px" }}>{title}</div>
    <div style={{ fontSize: "12px" }}>{sub}</div>
  </div>
);

export const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 24, color = C.primary }) => (
  <>
    <style>{`@keyframes qubiqon-spin { to { transform: rotate(360deg); } }`}</style>
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${color}24`,
        borderTopColor: color,
        display: "inline-block",
        animation: "qubiqon-spin 0.75s linear infinite",
      }}
    />
  </>
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
          <Paperclip size={16} color={C.vendor} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", fontWeight: 600 }}>{file.n}</div>
            <div style={{ fontSize: "10px", color: C.muted }}>{file.s}</div>
          </div>
          <button type="button" onClick={handleClear} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, display: "inline-flex", padding: 0 }}>
            <X size={14} />
          </button>
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
          <FileText size={24} color={C.primary} opacity={0.3} style={{ marginBottom: "4px" }} />
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

export const MultiFileUp: React.FC<{
  files: File[];
  onChange: (files: File[]) => void;
  req?: boolean;
  title?: string;
  accept?: string;
  hint?: string;
  radius?: string;
}> = ({ files, onChange, req, accept = ".pdf,.jpg,.jpeg,.png", hint, title = "Attachments", radius = "8px" }) => {
  const ref = useRef<HTMLInputElement>(null);
  const hintText = hint ?? (accept === ".pdf" ? "PDF only" : "PDF, JPG, PNG up to 10 MB");

  const handleAddFiles = (pickedFiles: FileList | null) => {
    if (!pickedFiles?.length) return;
    const nextFiles = [...(files ?? []), ...Array.from(pickedFiles)];
    const uniqueByNameAndSize = new Map<string, File>();
    nextFiles.forEach((file) => {
      uniqueByNameAndSize.set(`${file.name}:${file.size}:${file.lastModified}`, file);
    });
    onChange(Array.from(uniqueByNameAndSize.values()));
    if (ref.current) ref.current.value = "";
  };

  const handleRemove = (index: number) => {
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

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
      <div
        onClick={() => ref.current?.click()}
        style={{
          padding: "20px",
          border: `2px dashed ${C.border}`,
          borderRadius: radius,
          textAlign: "center",
          cursor: "pointer",
          background: C.surface,
          marginBottom: files.length > 0 ? "10px" : 0,
        }}
      >
        <UploadCloud size={24} color={C.primary} opacity={0.3} style={{ marginBottom: "4px" }} />
        <div style={{ fontSize: "12px", fontWeight: 600 }}>
          Drop files or <span style={{ color: C.vendor }}>browse</span>
        </div>
        <div style={{ fontSize: "10px", color: C.muted }}>{hintText}</div>
        <input
          ref={ref}
          type="file"
          accept={accept}
          multiple
          onChange={(e) => handleAddFiles(e.target.files)}
          style={{ display: "none" }}
        />
      </div>
      {files.length > 0 && (
        <div style={{ display: "grid", gap: "8px" }}>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                background: C.vendorBg,
                borderRadius: radius,
                border: `1px solid ${C.vendor}25`,
              }}
            >
              <Paperclip size={16} color={C.vendor} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 600 }}>{file.name}</div>
                <div style={{ fontSize: "10px", color: C.muted }}>{(file.size / 1024).toFixed(0)} KB</div>
              </div>
              <button type="button" onClick={() => handleRemove(index)} style={{ background: "none", border: "none", cursor: "pointer", color: C.danger, display: "inline-flex", padding: 0 }}>
                <X size={14} />
              </button>
            </div>
          ))}
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
        background: checked ? C.accent : C.border,
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

/** Column header: plain string, or `{ label, sortKey }` for API sort (`SortBy`). */
export type TblCol = string | false | { label: string; sortKey?: string; sx?: CSSProperties };

export const Tbl: React.FC<{
  cols: TblCol[];
  rows: TableRow[];
  onRow?: (row: TableRow) => void;
  headerSx?: CSSProperties;
  cellSx?: CSSProperties;
  bodyFallback?: ReactNode;
  /** Active sort field (PascalCase, e.g. `CreatedAt`, `Total`). */
  sortBy?: string;
  sortDesc?: boolean;
  onSortChange?: (sortKey: string) => void;
}> = ({ cols, rows, onRow, headerSx, cellSx, bodyFallback, sortBy, sortDesc, onSortChange }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "13px", color: "rgb(36, 36, 36)" }}>
      <thead>
        <tr>
          {cols
            .filter((c): c is Exclude<TblCol, false> => c !== false)
            .map((c, idx) => {
              const label = typeof c === "string" ? c : c.label;
              const sk = typeof c === "string" ? undefined : c.sortKey;
              const colSx = typeof c === "string" ? undefined : c.sx;
              const active =
                sk &&
                sortBy &&
                sk.replace(/\s/g, "").toLowerCase() === sortBy.replace(/\s/g, "").toLowerCase();
              const thStyle: CSSProperties = {
                padding: "10px 12px",
                textAlign: "left",
                fontSize: "13px",
                fontWeight: 600,
                color: "rgb(36, 36, 36)",
                borderBottom: "1px solid rgb(226, 230, 237)",
                whiteSpace: "nowrap",
                ...headerSx,
                ...colSx,
              };
              if (sk && onSortChange) {
                return (
                  <th key={`${label}-${idx}`} style={thStyle}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSortChange(sk);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        cursor: "pointer",
                        font: "inherit",
                        color: active ? C.accent : C.primary,
                        fontWeight: "inherit",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        textTransform: "inherit",
                        letterSpacing: "inherit",
                      }}
                    >
                      {label}
                      {active ? (
                        <span style={{ fontSize: "9px", opacity: 0.85 }}>{sortDesc ? "↓" : "↑"}</span>
                      ) : (
                        <span style={{ fontSize: "9px", opacity: 0.35 }}>↕</span>
                      )}
                    </button>
                  </th>
                );
              }
              return (
                <th key={`${label}-${idx}`} style={thStyle}>
                  {label}
                </th>
              );
            })}
        </tr>
      </thead>
      <tbody>
        {bodyFallback && rows.length === 0 ? (
          <tr>
            <td colSpan={cols.filter((c) => c !== false).length} style={{ borderBottom: `1px solid ${C.border}` }}>
              {bodyFallback}
            </td>
          </tr>
        ) : (
          rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRow?.(row)}
              style={{ cursor: onRow ? "pointer" : "default", transition: "background 0.15s", color: C.muted }}
              onMouseOver={(e) => (e.currentTarget.style.background = C.surface)}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {row._cells.map((c, j) => (
                <td
                  key={j}
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid rgb(226, 230, 237)",
                    color: "rgb(78, 78, 78)",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    fontWeight: 400,
                    lineHeight: "100%",
                    letterSpacing: "0px",
                    whiteSpace: "nowrap",
                    textAlign: "left",
                    ...cellSx,
                    ...c.sx,
                  }}
                >
                  {c.v}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

/** Sortable table header for custom `<table>` layouts (vendors, clients). */
export const SortTh: React.FC<{
  children: ReactNode;
  sortKey: string;
  sortBy?: string;
  sortDesc?: boolean;
  onSortChange?: (sortKey: string) => void;
}> = ({ children, sortKey, sortBy, sortDesc, onSortChange }) => {
  const active =
    sortBy &&
    sortKey.replace(/\s/g, "").toLowerCase() === sortBy.replace(/\s/g, "").toLowerCase();
  if (!onSortChange) {
    return (
      <th
        style={{
          padding: "10px 12px",
          textAlign: "left",
          fontSize: "13px",
          fontWeight: 600,
          color: "rgb(36, 36, 36)",
          borderBottom: "1px solid rgb(226, 230, 237)",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </th>
    );
  }
  return (
    <th
      style={{
        padding: "10px 12px",
        textAlign: "left",
        fontSize: "13px",
        fontWeight: 600,
        color: "rgb(36, 36, 36)",
        borderBottom: "1px solid rgb(226, 230, 237)",
        whiteSpace: "nowrap",
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSortChange(sortKey);
        }}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: "pointer",
          font: "inherit",
          color: active ? C.accent : C.primary,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          textTransform: "inherit",
          letterSpacing: "inherit",
        }}
      >
        {children}
        {active ? (
          <span style={{ fontSize: "9px", opacity: 0.85 }}>{sortDesc ? "↓" : "↑"}</span>
        ) : (
          <span style={{ fontSize: "9px", opacity: 0.35 }}>↕</span>
        )}
      </button>
    </th>
  );
};

export const Filter: React.FC<{
  /** @deprecated Search moved to ListPageHeader */
  search?: string;
  /** @deprecated Search moved to ListPageHeader */
  onSearch?: (v: string) => void;
  status: string;
  onStatus: (s: string) => void;
  opts: string[];
  /** Renders before status tabs (e.g. payment priority) */
  prepend?: ReactNode;
  /** @deprecated Search moved to ListPageHeader; kept for card toolbar refresh + tabs only */
  trailing?: ReactNode;
  /** When set, replaces the status tab row */
  statusSlot?: ReactNode;
  onRefresh?: () => void;
  refreshDisabled?: boolean;
  hidden?: boolean;
  visibleTabCount?: number;
}> = ({
  status,
  onStatus,
  opts,
  trailing,
  prepend,
  statusSlot,
  onRefresh,
  refreshDisabled,
  hidden,
  visibleTabCount = 4,
}) => {
  const tabs = opts.map((s) => ({ label: s === "all" ? "All" : s, value: s }));
  return (
    <div style={{ marginBottom: "14px" }}>
      {statusSlot ?? (
        <OverflowStatusTabs
          tabs={tabs}
          value={status}
          onChange={onStatus}
          visibleCount={visibleTabCount}
          onRefresh={onRefresh}
          refreshDisabled={refreshDisabled}
          hidden={hidden}
        />
      )}
      {prepend}
      {trailing ? <div style={{ flexShrink: 0, marginTop: "6px" }}>{trailing}</div> : null}
    </div>
  );
};

export {
  CollapsibleSearch,
  ListPageHeader,
  ListPageAddButton,
  OverflowStatusTabs,
  TableToolbarRefresh,
  useNavPageAdd,
} from "./list-toolbar";
export type {
  CollapsibleSearchProps,
  ListPageHeaderProps,
  ListPageAddButtonProps,
  StatusTab,
  OverflowStatusTabsProps,
} from "./list-toolbar";

export const CLog: React.FC<{ comments: ActivityComment[] }> = ({ comments }) =>
  comments?.length > 0 ? (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontSize: "10px", color: C.muted, marginBottom: "6px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Activity comments
      </div>
      {comments.map((c, i) => {
        const statusLabel = (c.status?.trim() || activityCommentStatusFallback(c.t)).trim();
        const border =
          c.t === "pay" ? C.info : c.t === "ok" ? C.success : c.t === "no" ? C.danger : C.accent;
        const pill = activityStatusPillColors(c.t);
        return (
          <div
            key={i}
            style={{
              padding: "8px 12px",
              background: C.surface,
              borderRadius: "6px",
              borderLeft: `3px solid ${border}`,
              marginBottom: "4px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                marginBottom: "4px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 600, minWidth: 0 }}>{c.by}</span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "4px",
                  flexShrink: 0,
                  marginLeft: "auto",
                  textAlign: "right",
                }}
              >
                {c.d ? (
                  <span style={{ fontSize: "10px", color: C.muted, whiteSpace: "nowrap" }}>{c.d}</span>
                ) : null}
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: pill.color,
                    background: pill.background,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    lineHeight: 1.3,
                    whiteSpace: "nowrap",
                  }}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
            <div style={{ fontSize: "11px", color: C.muted }}>{c.text}</div>
          </div>
        );
      })}
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
