import type { CSSProperties, ReactNode } from "react";
import {
  C,
  listPageHeaderMarginBottom,
  listPageHeaderPaddingRight,
  listTableBodyMarginTop,
  listTableCardPaddingX,
} from "../../shared/theme";
import PageShell from "../PageShell";
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
  /** Title row + dedicated search row (main list pages only) */
  standaloneSearchLayout?: boolean;
  /** Overrides --list-table-body-margin-top (gap above table card) */
  tableBodyMarginTop?: string;
  /** When set, wraps content in a fixed header + scrollable body layout */
  children?: ReactNode;
};

const listPageShellStyle = {
  ["--list-table-card-padding-x" as string]: listTableCardPaddingX,
  ["--list-table-body-margin-top" as string]: listTableBodyMarginTop,
  ["--list-page-header-margin-bottom" as string]: listPageHeaderMarginBottom,
  ["--list-page-header-padding-right" as string]: listPageHeaderPaddingRight,
} as CSSProperties;

export default function ListPageHeader({
  title,
  icon,
  search,
  addAction,
  actions,
  className,
  hidden,
  standaloneSearchLayout,
  tableBodyMarginTop,
  children,
}: ListPageHeaderProps) {
  if (hidden && children == null) return null;

  const useSearchRow = Boolean(search) && Boolean(standaloneSearchLayout);
  const actionContent = useSearchRow ? (
    <>
      <div className="list-page-header__row">
        <h1
          className="list-page-header__title"
          style={{
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: C.primary,
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 600,
            lineHeight: "100%",
            letterSpacing: "-0.02em",
          }}
        >
          {icon}
          {title}
        </h1>
        {addAction ? <div className="list-page-header__add">{addAction}</div> : null}
      </div>
      <div className="list-page-header__search-row">{search}</div>
    </>
  ) : search || addAction || actions ? (
    <div className="list-page-header__legacy">
      <h1
        className="list-page-header__title"
        style={{
          margin: 0,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: C.primary,
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 600,
          lineHeight: "100%",
          letterSpacing: "-0.02em",
        }}
      >
        {icon}
        {title}
      </h1>
      <div className="list-page-header__actions">
        {search || addAction ? (
          <div className="list-page-header__toolbar">
            {search}
            {addAction ? <div className="list-page-header__add-btn">{addAction}</div> : null}
          </div>
        ) : (
          actions
        )}
      </div>
    </div>
  ) : (
    <h1
      className="list-page-header__title"
      style={{
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        color: C.primary,
        fontFamily: "'Manrope', sans-serif",
        fontWeight: 600,
        lineHeight: "100%",
        letterSpacing: "-0.02em",
      }}
    >
      {icon}
      {title}
    </h1>
  );

  const headerEl = hidden ? null : (
    <div
      className={`list-page-header ${useSearchRow ? "list-page-header--standalone-search" : ""} ${className ?? ""}`.trim()}
    >
      {actionContent}
    </div>
  );

  if (children != null) {
    const body = (
      <div className={`list-page-body${hidden ? " list-page-body--embedded" : ""}`.trim()}>{children}</div>
    );
    if (hidden) return body;
    return (
      <PageShell
        header={headerEl}
        className="page-shell--list-page"
        style={
          tableBodyMarginTop
            ? { ...listPageShellStyle, ["--list-table-body-margin-top" as string]: tableBodyMarginTop }
            : listPageShellStyle
        }
      >
        {body}
      </PageShell>
    );
  }

  return headerEl;
}
