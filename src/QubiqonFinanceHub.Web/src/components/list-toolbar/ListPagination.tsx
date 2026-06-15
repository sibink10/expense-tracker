import { ChevronLeft, ChevronRight } from "lucide-react";
import { C, R } from "../../shared/theme";

export interface ListPaginationProps {
  page: number;
  totalCount: number;
  pageSize: number;
  totalPages?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

const navButtonStyle = (disabled: boolean): React.CSSProperties => ({
  width: 73,
  height: 28,
  borderRadius: R.control,
  padding: "4px 8px",
  gap: "4px",
  border: `1px solid ${C.subtleBorder}`,
  background: C.white,
  color: C.primary,
  opacity: disabled ? 0.45 : 1,
  cursor: disabled ? "not-allowed" : "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Inter', sans-serif",
  fontSize: "12px",
  fontWeight: 500,
  lineHeight: 1,
});

export default function ListPagination({
  page,
  totalCount,
  pageSize,
  totalPages,
  loading = false,
  onPageChange,
}: ListPaginationProps) {
  const displayTotalPages = Math.max(totalPages ?? (Math.ceil(totalCount / pageSize) || 1), 1);
  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = totalCount === 0 ? 0 : Math.min(startIndex + pageSize, totalCount);
  const prevDisabled = loading || page <= 1;
  const nextDisabled = loading || page >= displayTotalPages;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
        marginTop: "10px",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "12px", color: C.muted, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
        Showing {totalCount === 0 ? 0 : startIndex + 1}-{endIndex} of {totalCount}
      </span>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          disabled={prevDisabled}
          onClick={() => {
            if (prevDisabled) return;
            onPageChange(Math.max(1, page - 1));
          }}
          style={navButtonStyle(prevDisabled)}
        >
          <ChevronLeft size={14} strokeWidth={1.9} style={{ flexShrink: 0 }} />
          Prev
        </button>
        <span style={{ fontSize: "12px", color: C.muted, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
          Page {page} of {displayTotalPages}
        </span>
        <button
          type="button"
          disabled={nextDisabled}
          onClick={() => {
            if (nextDisabled) return;
            onPageChange(Math.min(displayTotalPages, page + 1));
          }}
          style={navButtonStyle(nextDisabled)}
        >
          Next
          <ChevronRight size={14} strokeWidth={1.9} style={{ flexShrink: 0 }} />
        </button>
      </div>
    </div>
  );
}
