import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Check,
  Download,
  Eye,
  FileText,
  IndianRupee,
  Paperclip,
  Pencil,
  RefreshCw,
  Save,
  Send,
  Signature,
  Trash2,
  UploadCloud,
  Wallet,
  X,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import Select from "react-select";
import { C, R } from "../shared/theme";
import { useIsMobile } from "../shared/useIsMobile";
import { EXP_S, BILL_S, ADV_S, INV_S } from "../shared/constants";
import { activityCommentStatusFallback } from "../shared/activityCommentStatus";
import type { ActivityComment } from "../types";
import { EditIcon, TrashIcon } from "./icons";
import { OverflowStatusTabs } from "./list-toolbar";
import "./shared/detail-modal.css";

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
            borderRadius: R.control,
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
            borderRadius: R.control,
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
          borderRadius: R.control,
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
            borderRadius: R.control,
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
      borderRadius: R.control,
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
        padding: "6px 10px",
        borderRadius: R.control,
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

const InModalContext = createContext(false);

const MODAL_BTN_ICON = { size: 14, strokeWidth: 1.9 } as const;

const ModalBtnSpinner = () => (
  <span
    style={{
      display: "inline-block",
      width: 12,
      height: 12,
      border: "2px solid currentColor",
      borderTopColor: "transparent",
      borderRadius: "50%",
      animation: "modal-btn-spin 0.7s linear infinite",
      opacity: 0.85,
    }}
  />
);

function collectTextContent(node: ReactNode): string {
  const parts: string[] = [];
  Children.forEach(node, (child) => {
    if (child == null || typeof child === "boolean") return;
    if (typeof child === "string" || typeof child === "number") {
      parts.push(String(child));
      return;
    }
    if (isValidElement(child) && child.type === Fragment) {
      parts.push(collectTextContent(child.props.children));
    }
  });
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function withoutTextContent(node: ReactNode): ReactNode {
  const items: ReactNode[] = [];
  Children.forEach(node, (child) => {
    if (child == null || typeof child === "boolean") return;
    if (typeof child === "string" || typeof child === "number") return;
    if (isValidElement(child) && child.type === Fragment) {
      const inner = withoutTextContent(child.props.children);
      if (inner != null && inner !== false) items.push(<Fragment key={items.length}>{inner}</Fragment>);
      return;
    }
    items.push(child);
  });
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  return items;
}

function hasRenderableContent(node: ReactNode): boolean {
  if (node == null || typeof node === "boolean") return false;
  if (Array.isArray(node)) return node.length > 0 && node.some(hasRenderableContent);
  return true;
}

function isLoadingLabel(text: string): boolean {
  return /(\.\.\.|…)$/i.test(text) || /\b(loading|syncing|downloading|updating|sending|approving|removing|saving|adding|processing)\b/i.test(text);
}

const MODAL_LABEL_ICONS: Record<string, ReactNode> = {
  Download: <Download {...MODAL_BTN_ICON} />,
  Close: <X {...MODAL_BTN_ICON} />,
  Cancel: <X {...MODAL_BTN_ICON} />,
  Approve: <Check {...MODAL_BTN_ICON} />,
  Reject: <XCircle {...MODAL_BTN_ICON} />,
  Pay: <Wallet {...MODAL_BTN_ICON} />,
  View: <Eye {...MODAL_BTN_ICON} />,
  Edit: <Pencil {...MODAL_BTN_ICON} />,
  Save: <Save {...MODAL_BTN_ICON} />,
  Add: <Check {...MODAL_BTN_ICON} />,
  Remove: <Trash2 {...MODAL_BTN_ICON} />,
  Disburse: <Wallet {...MODAL_BTN_ICON} />,
  Confirm: <Check {...MODAL_BTN_ICON} />,
  "Sync to storage": <RefreshCw {...MODAL_BTN_ICON} />,
  "Mark sent": <Send {...MODAL_BTN_ICON} />,
  "Mark as sent": <Send {...MODAL_BTN_ICON} />,
  "Mark paid": <IndianRupee {...MODAL_BTN_ICON} />,
  "Send for signing": <Signature {...MODAL_BTN_ICON} />,
  "Resend for signing": <Signature {...MODAL_BTN_ICON} />,
  Sign: <Signature {...MODAL_BTN_ICON} />,
  "Send for signature": <Signature {...MODAL_BTN_ICON} />,
  "Confirm payment": <Wallet {...MODAL_BTN_ICON} />,
};

function modalIconOnlyContent(children: ReactNode): { content: ReactNode; label: string } {
  const label = collectTextContent(children);
  const stripped = withoutTextContent(children);
  if (hasRenderableContent(stripped)) {
    return { content: stripped, label };
  }
  if (isLoadingLabel(label)) {
    return { content: <ModalBtnSpinner />, label };
  }
  const icon = MODAL_LABEL_ICONS[label];
  if (icon) return { content: icon, label };
  return { content: label ? label.charAt(0).toUpperCase() : "•", label };
}

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
  const inModal = useContext(InModalContext);
  const isMobile = useIsMobile();
  const iconOnly = inModal && isMobile;
  const { content, label: derivedLabel } = iconOnly ? modalIconOnlyContent(children) : { content: children, label: "" };
  const tooltip = title ?? derivedLabel;
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
      className={iconOnly ? "app-modal-btn" : undefined}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? undefined : tooltip || undefined}
      aria-label={iconOnly && tooltip ? tooltip : undefined}
      style={buttonStyle}
    >
      {content}
    </button>
  );
  if (disabled && tooltip) {
    return (
      <span title={tooltip} style={{ display: "inline-flex", cursor: "not-allowed" }}>
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
      borderRadius: R.control,
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
        borderRadius: v ? R.control : "50%",
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

const MODAL_SCROLL_CSS = `
  .app-modal-scroll {
    scrollbar-width: thin;
    scrollbar-color: ${C.surface} transparent;
    overflow-y: auto;
    overflow-x: hidden;
    min-width: 0;
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
  .mobile-h-scroll {
    overflow-x: hidden;
    max-width: 100%;
  }
  .mobile-h-scroll__inner {
    min-width: 0;
    max-width: 100%;
  }
  @media (max-width: 767px) {
    .mobile-h-scroll {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .mobile-h-scroll__inner {
      min-width: var(--mobile-h-scroll-min, 760px);
    }
    .app-modal-scroll .app-modal-btn {
      padding: 8px !important;
      min-width: 36px;
      min-height: 36px;
      justify-content: center;
      gap: 0 !important;
    }
  }
  @keyframes modal-btn-spin {
    to { transform: rotate(360deg); }
  }
  .detail-modal-grid--3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .detail-modal-grid--2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 720px) {
    .detail-modal-grid--3 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 520px) {
    .detail-modal-grid--3,
    .detail-modal-grid--2 {
      grid-template-columns: 1fr;
    }
  }
`;

/** Wide modal content (tables, invoice preview): horizontal scroll only below 768px. */
export const MobileHScroll: React.FC<{
  children: ReactNode;
  minWidth?: number;
  style?: CSSProperties;
}> = ({ children, minWidth = 760, style }) => (
  <div className="mobile-h-scroll" style={style}>
    <div
      className="mobile-h-scroll__inner"
      style={{ "--mobile-h-scroll-min": `${minWidth}px` } as CSSProperties}
    >
      {children}
    </div>
  </div>
);

export const Mdl: React.FC<{
  open: boolean;
  close: () => void;
  title: string;
  w?: boolean;
  /** Custom max width (e.g. "960px") for larger modals */
  maxWidth?: string;
  zIndex?: number;
  /** Refined header/body spacing (off for legacy invoice detail modal) */
  detail?: boolean;
  /** Small label above title (e.g. "Client", "Vendor") */
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
}> = ({
  open,
  close,
  title,
  w,
  maxWidth,
  zIndex = MODAL_Z_INDEX,
  detail = true,
  subtitle,
  onBack,
  children,
}) => {
  if (!open) return null;
  const resolvedMaxWidth = maxWidth ?? (w ? (detail ? "820px" : "760px") : detail ? "520px" : "500px");
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
        className={detail ? "detail-mdl-overlay" : undefined}
        style={{
          position: "absolute",
          inset: 0,
          background: detail ? undefined : "rgba(27,42,74,0.4)",
          backdropFilter: detail ? undefined : "blur(3px)",
        }}
      />
      <style>{MODAL_SCROLL_CSS}</style>
      <div
        className={detail ? "detail-mdl-panel" : undefined}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: detail ? undefined : "14px",
          width: "100%",
          maxWidth: resolvedMaxWidth,
          maxHeight: "88vh",
          overflow: "hidden",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          boxShadow: detail ? undefined : "0 20px 60px rgba(27,42,74,0.18)",
        }}
      >
        <div
          className={detail ? "detail-mdl-header" : undefined}
          style={{
            padding: detail ? undefined : "16px 24px 12px",
            borderBottom: detail ? undefined : `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            position: "sticky",
            top: 0,
            background: "#fff",
            borderRadius: detail ? undefined : "14px 14px 0 0",
            zIndex: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
            {detail && onBack && (
              <button type="button" onClick={onBack} aria-label="Back" className="detail-mdl-icon-btn">
                <ArrowLeft size={18} strokeWidth={2} />
              </button>
            )}
            <div className={detail ? "detail-mdl-header__text" : undefined} style={{ minWidth: 0 }}>
              {detail && subtitle && <span className="detail-mdl-kicker">{subtitle}</span>}
              <h2
                className={detail ? "detail-mdl-title" : undefined}
                style={
                  detail
                    ? undefined
                    : {
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: 700,
                        color: C.primary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }
                }
              >
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className={detail ? "detail-mdl-icon-btn" : undefined}
            style={
              detail
                ? undefined
                : {
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "16px",
                    color: C.muted,
                  }
            }
          >
            {detail ? <X size={18} strokeWidth={2} /> : "✕"}
          </button>
        </div>
        <InModalContext.Provider value={true}>
          <div
            className={`app-modal-scroll${detail ? " detail-mdl-body" : ""}`}
            style={{
              padding: detail ? undefined : "16px 24px 20px",
              position: "relative",
              zIndex: 0,
              flex: 1,
              minHeight: 0,
              background: detail ? "#fff" : undefined,
            }}
          >
            {detail ? (
              <div className="detail-mdl-body-inner">{children}</div>
            ) : (
              children
            )}
          </div>
        </InModalContext.Provider>
      </div>
    </div>
  );
};

export const Stat: React.FC<{ label: string; value: ReactNode }> = ({ label, value }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: R.control,
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
            borderRadius: R.control,
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
            borderRadius: R.control,
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
}> = ({ files, onChange, req, accept = ".pdf,.jpg,.jpeg,.png", hint, title = "Attachments", radius = R.control }) => {
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

export { default as PageShell, pageShellBodyStyle, pageShellRootStyle } from "./PageShell";
export type { PageShellProps } from "./PageShell";

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
              borderRadius: R.control,
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
                    borderRadius: R.control,
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
      borderRadius: R.control,
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
