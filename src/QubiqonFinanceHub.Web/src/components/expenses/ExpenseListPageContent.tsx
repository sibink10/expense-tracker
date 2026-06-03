import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Select from "react-select";
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  IndianRupee,
  ReceiptText,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import type { Expense } from "../../types";
import { C } from "../../shared/theme";
import { EVENTS, EXPENSE_PAY_DISABLED_NO_BILL_TOOLTIP, EXP_S, EXP_STATUS, ITEM_T, MODAL_T, ROLES } from "../../shared/constants";
import { fmtCur, nextListSort } from "../../shared/utils";
import { Btn, Badge, Tbl, Empty, Spinner, type TblCol } from "../ui";
import { useAppContext } from "../../context/AppContext";
import { getExpensesMapped } from "../../shared/api/expense";
import { canCancelExpenseRequest, expenseUserIsSubmitterOrBeneficiary } from "../../shared/expensePermissions";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: EXP_S.PENDING, value: EXP_STATUS.PENDING_APPROVAL },
  { label: EXP_S.APPROVED, value: "Approved" },
  { label: EXP_S.AWAITING_PAYMENT, value: "AwaitingPayment" },
  { label: EXP_S.COMPLETED, value: "Completed" },
  { label: EXP_S.PARTIALLY_PAID, value: "PartiallyPaid" },
  { label: EXP_S.REJECTED, value: "Rejected" },
  { label: EXP_S.CANCELLED, value: "Cancelled" },
] as const;

type StatusOption = (typeof STATUS_TABS)[number];

const workflowActionStyle = (fg: string, bg: string) => ({
  borderRadius: "4px",
  background: bg,
  color: fg,
  padding: "6px 8px",
  minHeight: 26,
});

export default function ExpenseListPageContent({ myOnly, isRequest, pendingOnly, hideHeader }: { myOnly?: boolean; isRequest?: boolean; pendingOnly?: boolean; hideHeader?: boolean }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { is, setMdl, user } = useAppContext();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const validStatusValues = new Set<string>(STATUS_TABS.map((tab) => tab.value));
  const statusParam = pendingOnly ? EXP_STATUS.PENDING_APPROVAL : searchParams.get("status") ?? "";
  const status = pendingOnly ? EXP_STATUS.PENDING_APPROVAL : validStatusValues.has(statusParam) ? statusParam : "";
  const [data, setData] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [sortDesc, setSortDesc] = useState(true);

  const myOnlyActual = myOnly ?? false;
  const showActionCol =
    is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN) || is(ROLES.EMPLOYEE);
  const showAddAction = Boolean(isRequest) && (is(ROLES.EMPLOYEE) || is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN));

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener(EVENTS.EXPENSES_REFRESH, handler);
    return () => window.removeEventListener(EVENTS.EXPENSES_REFRESH, handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    getExpensesMapped({
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
  }, [page, pageSize, search, status, myOnly, refreshKey, sortBy, sortDesc]);

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

  const statusTabs = pendingOnly
    ? [{ label: EXP_S.PENDING, value: EXP_STATUS.PENDING_APPROVAL }]
    : STATUS_TABS;
  const selectedStatus = statusTabs.find((tab) => tab.value === status) ?? statusTabs[0];

  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = totalCount === 0 ? 0 : Math.min(startIndex + pageSize, totalCount);
  const displayTotalPages = Math.max(totalPages, 1);

  const cols: TblCol[] = [
    { label: "ID", sortKey: "ExpenseCode", sx: { textAlign: "left" } },
    ...(!is(ROLES.EMPLOYEE)
      ? [{ label: "Employee", sortKey: "Employee", sx: { textAlign: "left" } } as TblCol]
      : []),
    { label: "Purpose", sortKey: "Purpose", sx: { textAlign: "left" } },
    { label: "Amount", sortKey: "Amount" },
    { label: "Balance Due", sortKey: "BalanceDue" },
    { label: "Bill date", sortKey: "BillDate" },
    { label: "Status" },
    ...(showActionCol ? ["Action"] : []),
  ];

  const rows = data.map((e) => {
    const hasDocuments = e.documents.length > 0 || !!(e.file || e.attachmentUrl);
    const canShowPayAction =
      e.status !== EXP_S.CANCELLED &&
      (is(ROLES.FINANCE) || is(ROLES.ADMIN)) &&
      (e.status === EXP_S.AWAITING_PAYMENT ||
        e.status === EXP_S.PARTIALLY_PAID ||
        e.status === EXP_S.APPROVED ||
        e.status === EXP_S.AWAITING_BILL);
    const canCancelExpenseRow = canCancelExpenseRequest(e, user);
    const canSelfApprove = expenseUserIsSubmitterOrBeneficiary(e, user);

    return {
      expense: e,
      _cells: [
        {
          v: <span style={{ fontWeight: 600, color: C.accent }}>{e.id}</span>,
          sx: { textAlign: "left" as const },
        },
        ...(!is(ROLES.EMPLOYEE)
          ? [
              {
                v: <span style={{ fontWeight: 600, color: C.primary }}>{e.empName}</span>,
                sx: { textAlign: "left" as const },
              },
            ]
          : []),
        {
          v: (
            <div style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {e.purpose}
            </div>
          ),
          sx: { textAlign: "left" as const },
        },
        { v: <span style={{ fontWeight: 700, color: C.primary }}>{fmtCur(e.amt)}</span> },
        {
          v: (
            <span style={{ fontWeight: 600, color: e.amt - (e.paidAmount ?? 0) > 0 ? C.info : C.muted }}>
              {fmtCur(e.amt - (e.paidAmount ?? 0))}
            </span>
          ),
        },
        { v: <span style={{ color: C.muted }}>{e.billDate ?? "NA"}</span> },
        { v: <Badge s={e.status} /> },
        ...(showActionCol
          ? [
              {
                v: (
                  <span
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
                      e.status !== EXP_S.CANCELLED &&
                      (e.status === EXP_S.PENDING || e.status === EXP_S.PENDING_BILL_APPROVAL) && (
                        <>
                          <Btn sm v="ghost" sx={workflowActionStyle(C.success, C.successBg)} onClick={() => setMdl({ t: MODAL_T.EXP_APPROVE, d: e })}>
                            <Check size={13} strokeWidth={1.9} />
                            Approve
                          </Btn>
                          <Btn sm v="ghost" sx={workflowActionStyle(C.danger, C.dangerBg)} onClick={() => setMdl({ t: MODAL_T.REJECT, d: e, it: ITEM_T.EXPENSE })}>
                            <X size={13} strokeWidth={1.9} />
                            Reject
                          </Btn>
                        </>
                      )}
                    {canShowPayAction && (
                      <>
                        <Btn sm v="ghost" sx={workflowActionStyle(C.danger, C.dangerBg)} onClick={() => setMdl({ t: MODAL_T.REJECT, d: e, it: ITEM_T.EXPENSE })}>
                          <X size={13} strokeWidth={1.9} />
                          Reject
                        </Btn>
                        <Btn
                          sm
                          v="ghost"
                          sx={workflowActionStyle(C.invoiceActionPaid, C.invoiceActionPaidBg)}
                          onClick={() => setMdl({ t: MODAL_T.PAY, d: e, it: ITEM_T.EXPENSE })}
                          disabled={!hasDocuments}
                          title={!hasDocuments ? EXPENSE_PAY_DISABLED_NO_BILL_TOOLTIP : undefined}
                        >
                          <IndianRupee size={13} strokeWidth={1.9} />
                          Pay
                        </Btn>
                      </>
                    )}
                    {canCancelExpenseRow && (
                      <Btn sm v="ghost" sx={workflowActionStyle(C.muted, C.surface)} onClick={() => setMdl({ t: MODAL_T.EXP_CANCEL_CONFIRM, d: e })}>
                        <Ban size={13} strokeWidth={1.9} />
                        Cancel
                      </Btn>
                    )}
                  </span>
                ),
                sx: { textAlign: "center" as const, verticalAlign: "middle" as const },
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
          .expenses-page-header {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .expenses-add-label {
            display: none;
          }

          .expenses-table-card {
            margin-top: 20px;
          }

          .expenses-table-controls {
            justify-content: center;
            flex-wrap: nowrap;
          }

          .expenses-status-tabs {
            display: none !important;
          }

          .expenses-status-select {
            display: block !important;
          }

          .expenses-table-search {
            flex: 0 1 260px;
            min-width: 0;
            max-width: 100% !important;
          }

          .expenses-search-refresh {
            justify-content: center;
          }
        }
      `}</style>
      {!hideHeader && (
        <div
          className="expenses-page-header"
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
          <ReceiptText size={24} strokeWidth={1.8} color={C.primary} />
          Expense requests
        </h1>
        {showAddAction && (
          <Btn
            v="primary"
            onClick={() => navigate("/expenses/add")}
            sx={{ borderRadius: "4px", boxShadow: C.cardShadow }}
          >
            <CirclePlus size={15} strokeWidth={1.8} />
            <span className="expenses-add-label">Add expense</span>
          </Btn>
        )}
      </div>
      )}
      <div
        className="expenses-table-card"
        style={{
          background: C.white,
          borderRadius: "12px",
          padding: "14px 16px 16px",
          marginTop: "26px",
          boxShadow: C.cardShadow,
        }}
      >
        <div
          className="expenses-table-controls"
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
            className="expenses-status-tabs"
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
                  fontFamily: "'Inter', sans-serif",
                  lineHeight: 1.2,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div
            className="expenses-search-refresh"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "10px",
              flex: "1 1 280px",
              minWidth: 0,
            }}
          >
            <div className="expenses-table-search" style={{ position: "relative", flex: 1, maxWidth: "260px", minWidth: "160px" }}>
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search expenses..."
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
              aria-label="Refresh expenses"
              title="Refresh expenses"
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
        <div className="expenses-status-select" style={{ display: pendingOnly ? "none" : "none", marginBottom: "10px" }}>
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
          onRow={(row) => setMdl({ t: MODAL_T.EXP_DETAIL, d: (row as (typeof rows)[number]).expense })}
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
                  Loading expenses...
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px" }}>Fetching expense requests.</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon={<ReceiptText size={38} strokeWidth={1.6} />}
                title={search ? "No expense requests found" : "No expense requests"}
                sub={search ? "Try a different search term." : "Submit an expense request to get started."}
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
