import { useState, useEffect, useMemo } from "react";
import { BadgePercent, ChevronLeft, ChevronRight, CirclePlus, Eye } from "lucide-react";
import { C } from "../../../shared/theme";
import {
  Btn,
  CollapsibleSearch,
  EditActionButton,
  Empty,
  ListPageHeader,
  Spinner,
  TableToolbarRefresh,
  Toggle,
  Tbl,
  type TblCol,
} from "../../ui";
import { getTaxConfigs, toggleTaxConfig } from "../../../shared/api/taxConfig";
import { useAppContext } from "../../../context/AppContext";
import type { TaxConfig } from "../../../types";
import { EVENTS, MODAL_T } from "../../../shared/constants";

const CLIENT_TAX_TYPE = "ClientTax";
const formatTaxType = (value?: string) => value === CLIENT_TAX_TYPE ? "Client Tax" : (value ?? "—");
const PAGE_SIZE = 10;

export default function AdminTaxPage() {
  const { setMdl } = useAppContext();
  const [items, setItems] = useState<TaxConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener(EVENTS.TAX_CONFIG_REFRESH, handler);
    return () => window.removeEventListener(EVENTS.TAX_CONFIG_REFRESH, handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    getTaxConfigs()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleTaxConfig(id);
      window.dispatchEvent(new CustomEvent(EVENTS.TAX_CONFIG_REFRESH));
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    if (!debouncedSearch) return items;
    return items.filter((item) =>
      [
        formatTaxType(item.type),
        item.name,
        `${item.rate}%`,
        item.section,
        item.subType,
        item.isActive ? "Active" : "Inactive",
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(debouncedSearch))
    );
  }, [debouncedSearch, items]);

  const totalCount = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startIndex = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE;
  const endIndex = totalCount === 0 ? 0 : Math.min(startIndex + PAGE_SIZE, totalCount);
  const pageItems = filteredItems.slice(startIndex, endIndex);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const centeredColSx = { textAlign: "center" as const, verticalAlign: "middle" as const };
  const cols: TblCol[] = [
    { label: "Type", sx: centeredColSx },
    "Name",
    { label: "Rate", sx: centeredColSx },
    { label: "Section", sx: centeredColSx },
    { label: "Sub type", sx: centeredColSx },
    { label: "Status", sx: centeredColSx },
    { label: "Action", sx: centeredColSx },
  ];

  const rows = pageItems.map((item) => ({
    tax: item,
    _cells: [
      { v: formatTaxType(item.type), sx: centeredColSx },
      { v: item.name, sx: { fontWeight: 600, color: C.primary } },
      { v: `${item.rate}%`, sx: centeredColSx },
      { v: item.section || "—", sx: centeredColSx },
      { v: item.subType ?? "—", sx: centeredColSx },
      {
        v: (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: 600,
              background: item.isActive ? C.successBg : C.surface,
              color: item.isActive ? C.success : C.muted,
            }}
          >
            {item.isActive ? "Active" : "Inactive"}
          </span>
        ),
        sx: centeredColSx,
      },
      {
        v: (
          <span
            style={{
              minHeight: 36,
              display: "inline-flex",
              gap: "8px",
              alignItems: "center",
              justifyContent: "center",
              verticalAlign: "middle",
            }}
          >
            <Btn
              sm
              v="ghost"
              sx={{
                width: 30,
                height: 30,
                padding: 0,
                background: C.invoiceActionSentBg,
                color: C.invoiceActionSent,
                borderRadius: "4px",
                justifyContent: "center",
              }}
              title="View"
              onClick={(e) => {
                e.stopPropagation();
                setMdl({ t: MODAL_T.TAX_CONFIG_DETAIL, d: item });
              }}
            >
              <Eye size={15} strokeWidth={1.9} />
            </Btn>
            <EditActionButton
              sx={{ width: 30, height: 30, background: C.actionEditBg, borderRadius: "4px" }}
              onClick={(e) => {
                e.stopPropagation();
                setMdl({ t: MODAL_T.TAX_CONFIG_EDIT, d: item });
              }}
            />
            <Toggle
              checked={item.isActive}
              disabled={togglingId === item.id}
              onChange={() => void handleToggle(item.id)}
            />
          </span>
        ),
        sx: centeredColSx,
      },
    ],
  }));

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 640px) {
          .list-page-header {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .admin-tax-add-label {
            display: none;
          }

          .admin-tax-table-card {
            margin-top: 20px;
          }
        }
      `}</style>
      <ListPageHeader
        className="list-page-header"
        title="Tax config"
        icon={<BadgePercent size={24} strokeWidth={1.8} color={C.primary} />}
        actions={
          <>
            <CollapsibleSearch
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search tax configs..."
            />
            <Btn
              v="primary"
              onClick={() => setMdl({ t: MODAL_T.TAX_CONFIG_ADD })}
              sx={{ borderRadius: "4px", boxShadow: C.cardShadow }}
            >
              <CirclePlus size={15} strokeWidth={1.8} />
              <span className="admin-tax-add-label">Add tax</span>
            </Btn>
          </>
        }
      />

      <div
        className="admin-tax-table-card"
        style={{
          background: C.white,
          borderRadius: "12px",
          padding: "14px 16px 16px",
          marginTop: "26px",
          boxShadow: C.cardShadow,
        }}
      >
        <TableToolbarRefresh
          onRefresh={() => setRefreshKey((k) => k + 1)}
          refreshDisabled={loading}
          refreshAriaLabel="Refresh tax configs"
        />

        <Tbl
          cols={cols}
          rows={loading ? [] : rows}
          onRow={(row) => setMdl({ t: MODAL_T.TAX_CONFIG_DETAIL, d: (row as (typeof rows)[number]).tax })}
          bodyFallback={
            loading ? (
              <div
                style={{
                  minHeight: "460px",
                  padding: "42px 16px",
                  textAlign: "center",
                  color: C.muted,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                <Spinner size={28} />
                <div style={{ marginTop: "10px", fontSize: "13px", fontWeight: 600, color: C.primary }}>
                  Loading tax configs...
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px" }}>Fetching tax configuration list.</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon={<BadgePercent size={38} strokeWidth={1.6} />}
                title={debouncedSearch ? "No tax configs found" : "No tax configs"}
                sub={debouncedSearch ? "Try a different search term." : "Add tax rules for invoices and bills."}
              />
            ) : null
          }
          headerSx={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            lineHeight: "100%",
            letterSpacing: 0,
            whiteSpace: "nowrap",
            verticalAlign: "middle",
          }}
          cellSx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            lineHeight: "100%",
            letterSpacing: 0,
            whiteSpace: "nowrap",
            verticalAlign: "middle",
          }}
        />
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
              disabled={loading || page <= 1}
              onClick={() => {
                if (loading || page <= 1) return;
                setPage((p) => Math.max(1, p - 1));
              }}
              style={{
                width: 73,
                height: 28,
                borderRadius: "4px",
                padding: "4px 8px",
                gap: "4px",
                border: `1px solid ${C.subtleBorder}`,
                background: C.white,
                color: C.primary,
                opacity: loading || page <= 1 ? 0.45 : 1,
                cursor: loading || page <= 1 ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              <ChevronLeft size={14} strokeWidth={1.9} style={{ flexShrink: 0 }} />
              Prev
            </button>
            <span style={{ fontSize: "12px", color: C.muted, fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={loading || page >= totalPages}
              onClick={() => {
                if (loading || page >= totalPages) return;
                setPage((p) => Math.min(totalPages, p + 1));
              }}
              style={{
                width: 73,
                height: 28,
                borderRadius: "4px",
                padding: "4px 8px",
                gap: "4px",
                border: `1px solid ${C.subtleBorder}`,
                background: C.white,
                color: C.primary,
                opacity: loading || page >= totalPages ? 0.45 : 1,
                cursor: loading || page >= totalPages ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              Next
              <ChevronRight size={14} strokeWidth={1.9} style={{ flexShrink: 0 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
