import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { C } from "../../shared/theme";
import { Av, Btn } from "../ui";
import "./detail-modal.css";

const EMPTY = "—";

export function displayDetailValue(value?: string | null): string {
  const t = (value ?? "").trim();
  return t || EMPTY;
}

export function DetailModalSurface({ children }: { children: ReactNode }) {
  return <div className="detail-mdl-surface">{children}</div>;
}

export function DetailEntityHero({
  name,
  subtitle,
  pills,
  avatarVariant = "default",
}: {
  name: string;
  subtitle?: string | null;
  pills?: ReactNode;
  avatarVariant?: "default" | "vendor" | "client";
}) {
  const avProps =
    avatarVariant === "vendor"
      ? { v: true as const }
      : avatarVariant === "client"
        ? { bg: C.clientAvatarBg, color: C.clientAvatarText }
        : {};

  return (
    <div className="detail-entity-hero">
      <Av n={name} sz={48} {...avProps} />
      <div className="detail-entity-hero__meta">
        <h3 className="detail-entity-hero__name">{name}</h3>
        {subtitle?.trim() && <p className="detail-entity-hero__sub">{subtitle}</p>}
      </div>
      {pills && <div className="detail-entity-hero__pills">{pills}</div>}
    </div>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="detail-section">
      <div className="detail-section-card">
        <h3 className="detail-section-title">{title}</h3>
        {children}
      </div>
    </section>
  );
}

export function DetailGrid({
  children,
  cols = 3,
}: {
  children: ReactNode;
  cols?: 2 | 3;
}) {
  return (
    <div
      className={`detail-modal-grid detail-modal-grid--${cols}`}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

export function DetailField({
  label,
  value,
  span,
}: {
  label: string;
  value?: string | null;
  span?: 1 | 2 | 3;
}) {
  const text = displayDetailValue(value);
  const isEmpty = text === EMPTY;
  return (
    <div className="detail-field" style={span ? { gridColumn: `span ${Math.min(span, 3)}` } : undefined}>
      <span className="detail-field-label">{label}</span>
      <div className={`detail-field-value${isEmpty ? " detail-field-value--empty" : ""}`}>{text}</div>
    </div>
  );
}

export function DetailFieldBlock({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return <DetailField label={label} value={value} span={3} />;
}

export function DetailStatusRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="detail-status-row">
      <span className="detail-field-label">{label}</span>
      <div style={{ marginTop: "8px" }}>{children}</div>
    </div>
  );
}

export function DetailPill({
  children,
  tone = "success",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "neutral";
}) {
  return <span className={`detail-pill detail-pill--${tone}`}>{children}</span>;
}

export function DetailAddressGrid({
  shipping,
  billing,
}: {
  shipping?: string | null;
  billing?: string | null;
}) {
  return (
    <DetailGrid cols={2}>
      <DetailField label="Shipping address" value={shipping} />
      <DetailField label="Billing address" value={billing} />
    </DetailGrid>
  );
}

export function DetailTable({
  columns,
  rows,
  emptyMessage = "No records",
}: {
  columns: string[];
  rows: ReactNode[][];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <div className="detail-table detail-table__empty">{emptyMessage}</div>;
  }
  const colTemplate = `repeat(${columns.length}, minmax(0, 1fr))`;
  return (
    <div className="detail-table">
      <div className="detail-table__head" style={{ gridTemplateColumns: colTemplate }}>
        {columns.map((col) => (
          <span key={col}>{col}</span>
        ))}
      </div>
      {rows.map((cells, i) => (
        <div key={i} className="detail-table__row" style={{ gridTemplateColumns: colTemplate }}>
          {cells.map((cell, j) => (
            <span key={j} style={{ minWidth: 0 }}>
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function DetailModalFooter({
  onEdit,
  onClose,
  editVariant = "primary",
  editLabel = "Edit",
}: {
  onEdit?: () => void;
  onClose: () => void;
  editVariant?: "primary" | "vendor" | "invoice";
  editLabel?: string;
}) {
  return (
    <div className="detail-modal-footer">
      <Btn v="secondary" onClick={onClose}>
        Close
      </Btn>
      {onEdit && (
        <Btn v={editVariant} onClick={onEdit}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Pencil size={14} strokeWidth={2.25} aria-hidden />
            {editLabel}
          </span>
        </Btn>
      )}
    </div>
  );
}
