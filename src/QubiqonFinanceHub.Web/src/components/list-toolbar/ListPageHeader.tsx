import type { ReactNode } from "react";
import { C } from "../../shared/theme";
import "./list-toolbar.css";

export type ListPageHeaderProps = {
  title: ReactNode;
  icon?: ReactNode;
  /** Search field; with addAction, stays on one row on mobile */
  search?: ReactNode;
  addAction?: ReactNode;
  /** Legacy combined actions when search/addAction are not split */
  actions?: ReactNode;
  className?: string;
  hidden?: boolean;
};

export default function ListPageHeader({
  title,
  icon,
  search,
  addAction,
  actions,
  className,
  hidden,
}: ListPageHeaderProps) {
  if (hidden) return null;

  const structuredActions = search || addAction;
  const actionContent = structuredActions ? (
    <div className="list-page-header__actions">
      {search && addAction ? (
        <div className="list-page-header__toolbar">
          {search}
          {addAction}
        </div>
      ) : (
        <>
          {search}
          {addAction}
        </>
      )}
    </div>
  ) : actions ? (
    <div className="list-page-header__actions">{actions}</div>
  ) : null;

  return (
    <div
      className={`list-page-header ${className ?? ""}`.trim()}
      style={{
        marginBottom: "12px",
      }}
    >
      <h1
        className="list-page-header__title"
        style={{
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: C.primary,
          fontFamily: "'Manrope', sans-serif",
          fontSize: "18px",
          fontWeight: 600,
          lineHeight: "100%",
          letterSpacing: "-0.02em",
        }}
      >
        {icon}
        {title}
      </h1>
      {actionContent}
    </div>
  );
}
