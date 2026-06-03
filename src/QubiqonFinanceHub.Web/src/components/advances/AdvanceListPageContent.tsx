import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Select from "react-select";
import {
  BanknoteArrowUp,
  ChevronLeft,
  ChevronRight,
  Check,
  CirclePlus,
  IndianRupee,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import type { Advance } from "../../types";
import { C } from "../../shared/theme";
import { ADV_S, EVENTS, ITEM_T, MODAL_T, ROLES } from "../../shared/constants";
import { fmtCur, nextListSort } from "../../shared/utils";
import { Btn, Badge, Tbl, Empty, Spinner, type TblCol } from "../ui";
import { useAppContext } from "../../context/AppContext";
import { getAdvancesMyMapped } from "../../shared/api/advance";
import { advanceRaisedByCurrentUser, canCancelAdvanceRequest } from "../../shared/expensePermissions";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: ADV_S.PENDING, value: "Pending" },
  { label: ADV_S.APPROVED, value: "Approved" },
  { label: ADV_S.DISBURSED, value: "Disbursed" },
  { label: ADV_S.PARTIALLY_DISBURSED, value: "PartiallyDisbursed" },
  { label: ADV_S.REJECTED, value: "Rejected" },
  { label: ADV_S.CANCELLED, value: "Cancelled" },
] as const;

type StatusOption = (typeof STATUS_TABS)[number];

const workflowActionStyle = (fg: string, bg: string) => ({
  borderRadius: "4px",
  background: bg,
  color: fg,
  padding: "6px 8px",
  minHeight: 26,
});

export default function AdvanceListPageContent({ myOnly, isRequest, pendingOnly, hideHeader }: { myOnly?: boolean; isRequest?: boolean; pendingOnly?: boolean; hideHeader?: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { is, setMdl, user } = useAppContext();
  const myOnlyActual = myOnly ?? false;
  const showActionCol =
    is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN) || is(ROLES.EMPLOYEE);
  const showAddAction = Boolean(isRequest) && (is(ROLES.EMPLOYEE) || is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN));
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [search, setSearch] = useState("");
  const validStatusValues = new Set<string>(STATUS_TABS.map((tab) => tab.value));
  const statusParam = pendingOnly ? "Pending" : searchParams.get("status") ?? "";
  const status = pendingOnly ? "Pending" : validStatusValues.has(statusParam) ? statusParam : "";
  const [data, setData] = useState<Advance[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener(EVENTS.ADVANCES_REFRESH, handler);
    return () => window.removeEventListener(EVENTS.ADVANCES_REFRESH, handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    getAdvancesMyMapped({
      page,
      pageSize,
      search: search || undefined,
      status: status || undefined,
      myOnly: myOnlyActual,
      sortBy,
      desc: sortDesc,
    })
      .then((r) => {
        setData(r.items);
        setTotalCount(r.totalCount ?? 0);
        setTotalPages(r.totalPages ?? 0);
      })
      .catch(() => {
        setData([]);
        setTotalCount(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, search, status, myOnlyActual, refreshKey, sortBy, sortDesc]);

  const handleSort = (key: string) => {
    const n = nextListSort(key, sortBy, sortDesc);
    setSortBy(n.sortBy);
    setSortDesc(n.desc);
    setPage(1);
  };

  const setStatusFilter = (nextStatus: StatusOption["value"]) => {
    if (pendingOnly) return;
    const nextParams = new URLSearchParams(searchParams);
    if (nextStatus) nextParams.set("status", nextStatus);
    else nextParams.delete("status");
    setSearchParams(nextParams, { replace: true });
    setPage(1);
  };

  const statusTabs: readonly StatusOption[] = pendingOnly
    ? [{ label: ADV_S.PENDING, value: "Pending" }]
    : STATUS_TABS;
  const selectedStatus: StatusOption = statusTabs.find((tab) => tab.value === status) ?? statusTabs[0];

  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = totalCount === 0 ? 0 : Math.min(startIndex + pageSize, totalCount);
  const displayTotalPages = Math.max(totalPages, 1);
  const hasSearchOrFilter = Boolean(search.trim() || status);

  const cols: TblCol[] = [
    { label: "ID", sortKey: "AdvanceCode", sx: { textAlign: "left", verticalAlign: "middle" } },
    ...(!is(ROLES.EMPLOYEE)
      ? [{ label: "Employee", sortKey: "Employee", sx: { textAlign: "left", verticalAlign: "middle" } } as TblCol]
      : []),
    { label: "Purpose", sortKey: "Purpose", sx: { textAlign: "left", verticalAlign: "middle" } },
    { label: "Amount", sortKey: "Amount" },
    { label: "Balance Due", sortKey: "BalanceDue" },
    { label: "Status" },
    ...(showActionCol ? (["Action"] as TblCol[]) : []),
  ];

  const rows = data.map((a) => {
    const canCancelAdvanceRow = canCancelAdvanceRequest(a, user);
    const canSelfApprove = advanceRaisedByCurrentUser(a, user);
    const balanceDue = a.amt - (a.paidAmount ?? 0);

    return {
      advance: a,
      _cells: [
        {
          v: <span style={{ fontWeight: 600, color: C.advance, whiteSpace: "nowrap" }}>{a.id}</span>,
          sx: { textAlign: "left" as const, verticalAlign: "middle" as const },
        },
        ...(!is(ROLES.EMPLOYEE)
          ? [
              {
                v: <span style={{ fontWeight: 600, color: C.primary, whiteSpace: "nowrap" }}>{a.empName || "NA"}</span>,
                sx: { textAlign: "left" as const, verticalAlign: "middle" as const },
              },
            ]
          : []),
        {
          v: (
            <div
              style={{
                maxWidth: "220px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: C.primary,
              }}
            >
              {a.purpose || "NA"}
            </div>
          ),
          sx: { textAlign: "left" as const, verticalAlign: "middle" as const },
        },
        { v: <span style={{ fontWeight: 700, color: C.primary, whiteSpace: "nowrap" }}>{fmtCur(a.amt)}</span> },
        {
          v: (
            <span style={{ fontWeight: 600, color: balanceDue > 0 ? C.advance : C.muted, whiteSpace: "nowrap" }}>
              {fmtCur(balanceDue)}
            </span>
          ),
        },
        { v: <Badge s={a.status} /> },
        ...(showActionCol
          ? [
              {
                v: (
                  <span
                    role="presentation"
                    onClick={(ev) => ev.stopPropagation()}
                    style={{
                      minHeight: 36,
                      display: "inline-flex",
                      gap: "6px",
                      alignItems: "center",
                      justifyContent: "center",
                      verticalAlign: "middle",
                    }}
                  >
                    {(is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN)) &&
                      !canSelfApprove &&
                      a.status !== ADV_S.CANCELLED &&
                      a.status === ADV_S.PENDING && (
                        <>
                          <Btn
                            sm
                            v="ghost"
                            sx={workflowActionStyle(C.success, C.successBg)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMdl({ t: MODAL_T.ADV_APPROVE, d: a });
                            }}
                          >
                            <Check size={13} strokeWidth={1.9} />
                            Approve
                          </Btn>
                          <Btn
                            sm
                            v="ghost"
                            sx={workflowActionStyle(C.danger, C.dangerBg)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMdl({ t: MODAL_T.REJECT, d: a, it: ITEM_T.ADVANCE });
                            }}
                          >
                            <X size={13} strokeWidth={1.9} />
                            Reject
                          </Btn>
                        </>
                      )}
                    {(is(ROLES.FINANCE) || is(ROLES.ADMIN)) &&
                      a.status !== ADV_S.CANCELLED &&
                      (a.status === ADV_S.APPROVED || a.status === ADV_S.PARTIALLY_DISBURSED) && (
                        <>
                          <Btn
                            sm
                            v="ghost"
                            sx={workflowActionStyle(C.invoiceActionPaid, C.invoiceActionPaidBg)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMdl({ t: MODAL_T.ADV_DISBURSE, d: a });
                            }}
                          >
                            <IndianRupee size={13} strokeWidth={1.9} />
                            Disburse
                          </Btn>
                          <Btn
                            sm
                            v="ghost"
                            sx={workflowActionStyle(C.danger, C.dangerBg)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMdl({ t: MODAL_T.REJECT, d: a, it: ITEM_T.ADVANCE });
                            }}
                          >
                            <X size={13} strokeWidth={1.9} />
                            Reject
                          </Btn>
                        </>
                      )}
                    {canCancelAdvanceRow && (
                      <Btn
                        sm
                        v="ghost"
                        sx={workflowActionStyle(C.danger, C.dangerBg)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMdl({ t: MODAL_T.ADV_CANCEL_CONFIRM, d: a });
                        }}
                      >
                        <X size={13} strokeWidth={1.9} />
                        Cancel
                      </Btn>
                    )}
                  </span>
                ),
                sx: {
                  textAlign: "center" as const,
                  verticalAlign: "middle" as const,
                },
              },
            ]
          : []),
      ],
    };
  });

  return (
    <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
      <style>{`
        @media (max-width: 640px) {
          .advances-page-header {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .advances-add-label {
            display: none;
          }

          .advances-table-card {
            margin-top: 20px;
          }

          .advances-table-controls {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .advances-status-tabs {
            display: none !important;
          }

          .advances-status-select {
            display: block !important;
          }

          .advances-table-search {
            flex: 0 1 260px;
            min-width: 0;
            max-width: 100% !important;
          }

          .advances-search-refresh {
            justify-content: center;
          }
        }
      `}</style>
      {!hideHeader && (
        <div
          className="advances-page-header"
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
          <BanknoteArrowUp size={24} strokeWidth={1.8} color={C.primary} />
          Advance requests
        </h1>
        {showAddAction && (
          <Btn
            v="primary"
            onClick={() => setMdl({ t: MODAL_T.ADV_REQUEST })}
            sx={{ borderRadius: "4px", boxShadow: C.cardShadow }}
          >
            <CirclePlus size={15} strokeWidth={1.8} />
            <span className="advances-add-label">Request advance</span>
          </Btn>
        )}
      </div>
      )}
      <div
        className="advances-table-card"
        style={{
          background: C.white,
          borderRadius: "12px",
          padding: "14px 16px 16px",
          marginTop: "26px",
          boxShadow: C.cardShadow,
        }}
      >
        <div
          className="advances-table-controls"
          style={{
            marginBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div
            className="advances-status-tabs"
            style={{
              display: pendingOnly ? "none" : "flex",
              gap: "4px",
              padding: "2px",
              background: C.white,
              border: `0.5px solid ${C.border}`,
              borderRadius: "4px",
              width: "fit-content",
              maxWidth: "100%",
              overflowX: "auto",
            }}
          >
            {statusTabs.map((tab) => (
              <button
                key={tab.value || "all"}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "4px",
                  background: status === tab.value ? C.successBg : C.white,
                  color: status === tab.value ? C.success : C.muted,
                  fontWeight: status === tab.value ? 600 : 500,
                  fontSize: "12px",
                  lineHeight: 1.2,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "'Inter', 'Manrope', sans-serif",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div
            className="advances-search-refresh"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "10px",
              flex: "1 1 280px",
              minWidth: 0,
            }}
          >
            <div className="advances-table-search" style={{ position: "relative", flex: 1, maxWidth: "260px", minWidth: "160px" }}>
              <input
                type="search"
                placeholder="Search advances..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
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
              aria-label="Refresh advances"
              title="Refresh advances"
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
        </div>
        <div className="advances-status-select" style={{ display: pendingOnly ? "none" : "none", marginBottom: "10px" }}>
          <Select<StatusOption, false>
            value={selectedStatus}
            onChange={(option) => setStatusFilter((option ?? STATUS_TABS[0]).value)}
            options={[...statusTabs]}
            isSearchable={false}
            styles={{
              control: (base) => ({
                ...base,
                minHeight: "34px",
                borderRadius: 8,
                borderColor: C.border,
                boxShadow: "none",
                fontSize: 12,
                fontFamily: "'Inter', 'Manrope', sans-serif",
              }),
              valueContainer: (base) => ({
                ...base,
                padding: "0 10px",
              }),
              indicatorSeparator: () => ({ display: "none" }),
              menu: (base) => ({
                ...base,
                borderRadius: 8,
                boxShadow: C.cardShadow,
                overflow: "hidden",
                zIndex: 20,
              }),
              option: (base, state) => ({
                ...base,
                fontSize: 12,
                fontFamily: "'Inter', 'Manrope', sans-serif",
                background: state.isSelected ? C.successBg : state.isFocused ? C.surface : C.white,
                color: state.isSelected ? C.success : C.primary,
              }),
            }}
          />
        </div>
        <Tbl
          cols={cols}
          rows={loading ? [] : rows}
          onRow={(row) => setMdl({ t: MODAL_T.ADV_DETAIL, d: (row as (typeof rows)[number]).advance })}
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
                  Loading advances...
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px" }}>Fetching advance requests.</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon={<BanknoteArrowUp size={38} strokeWidth={1.6} />}
                title={hasSearchOrFilter ? "No advance requests found" : "No advance requests"}
                sub={hasSearchOrFilter ? "Try a different search or filter." : "Request your first advance to get started."}
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
    </div>
  );
}
