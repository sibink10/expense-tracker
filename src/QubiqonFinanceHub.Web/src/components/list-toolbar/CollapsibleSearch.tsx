import { Search } from "lucide-react";
import { C } from "../../shared/theme";
import "./list-toolbar.css";

export type CollapsibleSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** @deprecated No longer used; search is always visible */
  expanded?: boolean;
  /** @deprecated No longer used */
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
};

/** Always-visible search field (name kept for existing imports). */
export default function CollapsibleSearch({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: CollapsibleSearchProps) {
  return (
    <div
      className={`list-toolbar-search ${className ?? ""}`.trim()}
      style={
        {
          ["--lt-border" as string]: C.border,
          ["--lt-muted" as string]: C.muted,
          ["--lt-primary" as string]: C.primary,
        } as React.CSSProperties
      }
    >
      <span className="list-toolbar-search__icon" aria-hidden>
        <Search size={16} strokeWidth={2} />
      </span>
      <input
        type="search"
        className="list-toolbar-search__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
