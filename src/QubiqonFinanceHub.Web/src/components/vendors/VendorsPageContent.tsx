import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, ChevronLeft, ChevronRight, CirclePlus, RefreshCw, Search } from "lucide-react";
import { C } from "../../shared/theme";
import { Av, Btn, DeleteActionButton, EditActionButton, Empty, Spinner, Tbl, type TblCol } from "../ui";
import VendorDeleteConfirmModal from "./VendorDeleteConfirmModal";
import { nextListSort } from "../../shared/utils";
import { useAppContext } from "../../context/AppContext";
import { getVendors } from "../../shared/api/vendor";
import type { Vendor } from "../../types";

export default function VendorsPage() {
  const navigate = useNavigate();
  const { is, setMdl } = useAppContext();
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
    window.addEventListener("vendors-refresh", handler);
    return () => window.removeEventListener("vendors-refresh", handler);
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
    is("admin") && "Actions",
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
      ...(is("admin")
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
                    sx={{ width: 30, height: 30, background: C.actionEditBg, borderRadius: "4px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMdl({ t: "vendor-edit", d: vendor });
                    }}
                  />
                  <DeleteActionButton
                    sx={{ width: 30, height: 30, background: C.actionDeleteBg, borderRadius: "4px" }}
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
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 640px) {
          .vendors-page-header {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .vendors-add-label {
            display: none;
          }

          .vendors-table-card {
            margin-top: 20px;
          }

          .vendors-table-controls {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .vendors-table-search {
            flex: 0 1 260px;
            min-width: 0;
            max-width: 100% !important;
          }
        }
      `}</style>
      <div
        className="vendors-page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <h1
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
          <BriefcaseBusiness size={24} strokeWidth={1.8} color={C.primary} />
          Vendors
        </h1>
        {is("admin") && (
          <Btn
            v="primary"
            onClick={() => navigate("/vendors/add")}
            sx={{ borderRadius: "4px", boxShadow: C.cardShadow }}
          >
            <CirclePlus size={15} strokeWidth={1.8} />
            <span className="vendors-add-label">Add vendor</span>
          </Btn>
        )}
      </div>
      <div
        className="vendors-table-card"
        style={{
          background: C.white,
          borderRadius: "12px",
          padding: "14px 16px 16px",
          marginTop: "26px",
          boxShadow: C.cardShadow,
        }}
      >
        <div
          className="vendors-table-controls"
          style={{
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div className="vendors-table-search" style={{ position: "relative", flex: 1, maxWidth: "260px", minWidth: "160px" }}>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search vendors..."
              style={{
                width: "100%",
                padding: "7px 12px 7px 34px",
                border: `1.5px solid ${C.border}`,
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "'Inter', 'Manrope', sans-serif",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: C.muted,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <Search size={16} strokeWidth={2} />
            </span>
          </div>
          <button
            type="button"
            aria-label="Refresh vendors"
            title="Refresh vendors"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            style={{
              width: 32,
              height: 32,
              border: "none",
              borderRadius: "4px",
              background: "transparent",
              color: C.primary,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <RefreshCw size={20} strokeWidth={1.9} />
          </button>
        </div>

        <Tbl
          cols={cols}
          rows={loading ? [] : rows}
          onRow={(row) => setMdl({ t: "vendor-detail", d: (row as (typeof rows)[number]).vendor })}
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
                borderRadius: "4px",
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
    </div>
  );
}
