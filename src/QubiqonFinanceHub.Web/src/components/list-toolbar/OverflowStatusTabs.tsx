import { useEffect, useMemo, useState } from "react";
import Select, { type StylesConfig } from "react-select";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { C } from "../../shared/theme";
import "./list-toolbar.css";

export type StatusTab = { label: string; value: string };

const mobileStatusSelectStyles: StylesConfig<StatusTab, false> = {
  container: (base) => ({
    ...base,
    flex: "1 1 auto",
    minWidth: 0,
    width: "100%",
  }),
  control: (base) => ({
    ...base,
    minHeight: "34px",
    borderRadius: 8,
    borderColor: C.border,
    boxShadow: "none",
    fontSize: 12,
    fontFamily: "'Inter', 'Manrope', sans-serif",
    cursor: "pointer",
    width: "100%",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 10px",
  }),
  singleValue: (base) => ({
    ...base,
    color: C.primary,
    fontWeight: 500,
  }),
  placeholder: (base) => ({
    ...base,
    color: C.muted,
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({
    ...base,
    color: C.muted,
    padding: "0 8px",
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 8,
    boxShadow: C.cardShadow,
    overflow: "hidden",
    zIndex: 30,
  }),
  menuList: (base) => ({
    ...base,
    paddingTop: 4,
    paddingBottom: 4,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: 12,
    fontFamily: "'Inter', 'Manrope', sans-serif",
    color: C.primary,
    fontWeight: state.isSelected ? 600 : 400,
    backgroundColor: state.isSelected ? C.successBg : state.isFocused ? C.surface : C.white,
    cursor: "pointer",
  }),
};

export type OverflowStatusTabsProps = {
  tabs: readonly StatusTab[];
  value: string;
  onChange: (value: string) => void;
  visibleCount?: number;
  onRefresh?: () => void;
  refreshDisabled?: boolean;
  refreshAriaLabel?: string;
  hidden?: boolean;
  className?: string;
  mobileSelectAriaLabel?: string;
};

function tabButton(tab: StatusTab, active: boolean, onClick: () => void) {
  return (
    <button
      key={tab.value || "__all__"}
      type="button"
      role="tab"
      aria-selected={active}
      className={`list-toolbar-overflow-tabs__tab${active ? " list-toolbar-overflow-tabs__tab--active" : ""}`}
      onClick={onClick}
    >
      {tab.label}
    </button>
  );
}

export default function OverflowStatusTabs({
  tabs,
  value,
  onChange,
  visibleCount = 4,
  onRefresh,
  refreshDisabled,
  refreshAriaLabel = "Refresh",
  hidden,
  className,
  mobileSelectAriaLabel = "Filter by status",
}: OverflowStatusTabsProps) {
  const [expanded, setExpanded] = useState(false);

  const primary = tabs.slice(0, visibleCount);
  const overflow = tabs.slice(visibleCount);
  const hasOverflow = overflow.length > 0;
  const visibleTabs = expanded || !hasOverflow ? tabs : primary;

  useEffect(() => {
    if (tabs.slice(visibleCount).some((t) => t.value === value)) setExpanded(true);
  }, [value, tabs, visibleCount]);

  const tabOptions = useMemo(() => [...tabs], [tabs]);
  const selectedTab = tabOptions.find((tab) => tab.value === value) ?? tabOptions[0];

  if (hidden || tabs.length === 0) return null;

  const cssVars = {
    ["--lt-border" as string]: C.border,
    ["--lt-muted" as string]: C.muted,
    ["--lt-primary" as string]: C.primary,
    ["--lt-success" as string]: C.success,
    ["--lt-success-bg" as string]: C.successBg,
  } as React.CSSProperties;

  return (
    <div
      className={`list-toolbar-overflow-tabs ${className ?? ""}`.trim()}
      style={cssVars}
      role="presentation"
    >
      {onRefresh ? (
        <button
          type="button"
          className="list-toolbar-overflow-tabs__refresh"
          aria-label={refreshAriaLabel}
          title={refreshAriaLabel}
          onClick={onRefresh}
          disabled={refreshDisabled}
        >
          <RefreshCw size={20} strokeWidth={1.9} />
        </button>
      ) : null}

      <div className="list-toolbar-overflow-tabs__desktop">
        <div className="list-toolbar-overflow-tabs__group" role="tablist" aria-label="Status filters">
          {visibleTabs.map((tab) => tabButton(tab, tab.value === value, () => onChange(tab.value)))}
        </div>

        {hasOverflow ? (
          <button
            type="button"
            className="list-toolbar-overflow-tabs__chevron"
            aria-label={expanded ? "Show fewer status filters" : "Show more status filters"}
            aria-expanded={expanded}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        ) : null}
      </div>

      <div className="list-toolbar-overflow-tabs__mobile-select">
        <Select<StatusTab, false>
          aria-label={mobileSelectAriaLabel}
          value={selectedTab}
          onChange={(option) => onChange((option ?? tabOptions[0]).value)}
          options={tabOptions}
          isSearchable={false}
          styles={mobileStatusSelectStyles}
        />
      </div>
    </div>
  );
}

/** Refresh-only row for pages without status tabs */
export function TableToolbarRefresh({
  onRefresh,
  refreshDisabled,
  refreshAriaLabel = "Refresh",
}: {
  onRefresh: () => void;
  refreshDisabled?: boolean;
  refreshAriaLabel?: string;
}) {
  return (
    <div
      className="list-toolbar-table-toolbar"
      style={
        {
          ["--lt-primary" as string]: C.primary,
        } as React.CSSProperties
      }
    >
      <button
        type="button"
        className="list-toolbar-overflow-tabs__refresh"
        aria-label={refreshAriaLabel}
        title={refreshAriaLabel}
        onClick={onRefresh}
        disabled={refreshDisabled}
      >
        <RefreshCw size={20} strokeWidth={1.9} />
      </button>
    </div>
  );
}
