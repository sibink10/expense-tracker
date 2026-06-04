import { useState, useEffect } from "react";
import { BriefcaseBusiness, ChevronLeft, ChevronRight } from "lucide-react";
import { C, R, listSectionTableBodyMarginTop, listTableCardStyle, tableIconButtonSx } from "../../shared/theme";
import {
  Av,
  CollapsibleSearch,
  DeleteActionButton,
  EditActionButton,
  Empty,
  ListPageHeader,
  ListPageAddButton,
  Spinner,
  TableToolbarRefresh,
  Tbl,
  useNavPageAdd,
  type TblCol,
} from "../ui";
import VendorDeleteConfirmModal from "./VendorDeleteConfirmModal";
import { nextListSort } from "../../shared/utils";
import { useAppContext } from "../../context/AppContext";
import { getVendors } from "../../shared/api/vendor";
import type { Vendor } from "../../types";
import { EVENTS, MODAL_T, ROLES } from "../../shared/constants";

export default function VendorsPage() {
  const { is, setMdl } = useAppContext();
  const navAdd = useNavPageAdd();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [sortDesc, setSortDesc] = useState(true);

  const handleSort = (key: string) => {
    const n = nextListSort(key, sortBy, sortDesc);
    setSortBy(n.sortBy);
    setSortDesc(n.desc);
    setPage(1);
  };

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener(EVENTS.VENDORS_REFRESH, handler);
    return () => window.removeEventListener(EVENTS.VENDORS_REFRESH, handler);
  }, []);

  useEffect(() => {
    if (!deleteTarget) {
      setDeleteLoading(false);
      setDeleteError(null);
    } else {
      setDeleteError(null);
    }
  }, [deleteTarget]);



  useEffect(() => {
    setLoading(true);
    getVendors(page, pageSize, search, sortBy, sortDesc)
      .then((res) => {
        setVendors(res.items);
        setTotalCount(res.totalCount);
        setTotalPages(res.totalPages);
      })
      .catch(() => {
        setVendors([]);
        setTotalCount(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, search, refreshKey, sortBy, sortDesc]);

  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = totalCount === 0 ? 0 : Math.min(startIndex + pageSize, totalCount);
  const displayTotalPages = Math.max(totalPages, 1);

  const centeredCellSx = {
    textAlign: "center" as const,
    verticalAlign: "middle" as const,
  };

  const cols: TblCol[] = [
    { label: "Vendor", sortKey: "Name", sx: { textAlign: "left" } },
    { label: "GSTIN", sortKey: "GSTIN" },
    { label: "Email", sortKey: "Email" },
    { label: "Contact", sortKey: "ContactPerson" },
    { label: "Category", sortKey: "Category" },
    is(ROLES.ADMIN) && "Actions",
  ];

  const rows = vendors.map((vendor) => ({
    vendor,
    _cells: [
      {
        v: (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <Av n={vendor.name} sz={36} bg={C.successBg} color={C.vendor} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, color: C.primary }}>{vendor.name}</div>
              {vendor.ph && <div style={{ fontSize: "11px", color: C.muted, marginTop: "5px" }}>{vendor.ph}</div>}
            </div>
          </div>
        ),
        sx: {
          textAlign: "left" as const,
          verticalAlign: "middle" as const,
        },
      },
      { v: vendor.gstin || "NA", sx: centeredCellSx },
      { v: vendor.email || "NA", sx: centeredCellSx },
      { v: vendor.contactPerson || "NA", sx: centeredCellSx },
      { v: vendor.cat || "NA", sx: centeredCellSx },
      ...(is(ROLES.ADMIN)
        ? [
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
                  <EditActionButton
                    sx={tableIconButtonSx(C.actionEditBg)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMdl({ t: MODAL_T.VENDOR_EDIT, d: vendor });
                    }}
                  />
                  <DeleteActionButton
                    sx={tableIconButtonSx(C.actionDeleteBg)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(vendor);
                    }}
                  />
                </span>
              ),
              sx: centeredCellSx,
            },
          ]
        : []),
    ],
  }));

  return (
      <ListPageHeader
        tableBodyMarginTop={listSectionTableBodyMarginTop}
        className="list-page-header"
        title="Vendors"
        icon={<BriefcaseBusiness size={24} strokeWidth={1.8} color={C.primary} />}
        search={
          <CollapsibleSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search vendors..."
          />
        }
        addAction={
          is(ROLES.ADMIN) && navAdd ? (
            <ListPageAddButton addPath={navAdd.addPath} label="Add vendor" />
          ) : undefined
        }
      >
      <div className="vendors-table-card list-table-card" style={listTableCardStyle}>
        <TableToolbarRefresh
          onRefresh={() => setRefreshKey((k) => k + 1)}
          refreshDisabled={loading}
          refreshAriaLabel="Refresh vendors"
        />

        <Tbl
          cols={cols}
          rows={loading ? [] : rows}
          onRow={(row) => setMdl({ t: MODAL_T.VENDOR_DETAIL, d: (row as (typeof rows)[number]).vendor })}
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
                  Loading vendors...
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px" }}>Fetching vendor list.</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon={<BriefcaseBusiness size={38} strokeWidth={1.6} />}
                title={search.trim() ? "No vendors found" : "No vendors"}
                sub={search.trim() ? "Try a different search term." : "Add vendors to manage bills."}
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
            textAlign: "center",
            verticalAlign: "middle",
          }}
          cellSx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "13px",
            fontWeight: 400,
            lineHeight: "100%",
            letterSpacing: 0,
            whiteSpace: "nowrap",
            textAlign: "center",
            verticalAlign: "middle",
          }}
          sortBy={sortBy}
          sortDesc={sortDesc}
          onSortChange={handleSort}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
                borderRadius: R.control,
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
              Page {page} of {displayTotalPages}
            </span>
            <button
              type="button"
              disabled={loading || page >= displayTotalPages}
              onClick={() => {
                if (loading || page >= displayTotalPages) return;
                setPage((p) => Math.min(displayTotalPages, p + 1));
              }}
              style={{
                width: 73,
                height: 28,
                borderRadius: R.control,
                padding: "4px 8px",
                gap: "4px",
                border: `1px solid ${C.subtleBorder}`,
                background: C.white,
                color: C.primary,
                opacity: loading || page >= displayTotalPages ? 0.45 : 1,
                cursor: loading || page >= displayTotalPages ? "not-allowed" : "pointer",
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

      <VendorDeleteConfirmModal
        target={deleteTarget}
        loading={deleteLoading}
        error={deleteError}
        setLoading={setDeleteLoading}
        setError={setDeleteError}
        onClose={() => setDeleteTarget(null)}
        onRemoved={() => setRefreshKey((k) => k + 1)}
      />
    </ListPageHeader>
  );
}
