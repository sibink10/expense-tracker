import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, IndianRupee, ReceiptText, X } from "lucide-react";
import type { Bill } from "../../types";
import { C, R, workflowTableActionStyle } from "../../shared/theme";
import { BILL_PAYMENT_PRIORITY, BILL_S, EVENTS, ITEM_T, MODAL_T, ROLES } from "../../shared/constants";
import { fmtCur, daysOverdueFromDueYmd, nextListSort } from "../../shared/utils";
import {
  Av,
  Btn,
  Badge,
  Tbl,
  Empty,
  Spinner,
  CollapsibleSearch,
  ListPageHeader,
  ListPageAddButton,
  OverflowStatusTabs,
  useNavPageAdd,
  type TblCol,
} from "../ui";
import { useAppContext } from "../../context/AppContext";
import { getBills } from "../../shared/api/bill";

type BillFilterOption = { label: string; value: string };

const STATUS_OPTIONS: BillFilterOption[] = [
  { label: "All bills", value: "all" },
  { label: BILL_S.SUBMITTED, value: BILL_S.SUBMITTED },
  { label: BILL_S.APPROVED, value: BILL_S.APPROVED },
  { label: BILL_S.PAID, value: BILL_S.PAID },
  { label: BILL_S.PARTIALLY_PAID, value: BILL_S.PARTIALLY_PAID },
  { label: BILL_S.OVERDUE, value: BILL_S.OVERDUE },
  { label: BILL_S.REJECTED, value: BILL_S.REJECTED },
];

const PAYMENT_PRIORITY_OPTIONS: BillFilterOption[] = [
  { label: "Pay now", value: `pay:${BILL_PAYMENT_PRIORITY.IMMEDIATE}` },
  { label: "Pay later", value: `pay:${BILL_PAYMENT_PRIORITY.LATER}` },
];

const BILL_FILTER_OPTIONS = [...STATUS_OPTIONS, ...PAYMENT_PRIORITY_OPTIONS];

const BILL_TAB_PRIMARY_VALUES = ["all", BILL_S.SUBMITTED, BILL_S.APPROVED, BILL_S.PAID];

export default function BillListPage({ pendingOnly, hideHeader }: { pendingOnly?: boolean; hideHeader?: boolean } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { search, setSearch, sf, setSf, fil, is, setMdl } = useAppContext();
  const navAdd = useNavPageAdd();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const validStatusValues = new Set<string>(STATUS_OPTIONS.map((option) => option.value));
  const statusParam = pendingOnly ? BILL_S.SUBMITTED : searchParams.get("status") ?? "all";
  const normalizedStatus = pendingOnly ? BILL_S.SUBMITTED : validStatusValues.has(statusParam) ? statusParam : "all";

  const payPriorityParam = pendingOnly ? undefined : searchParams.get("payPriority");
  const payPriority =
    payPriorityParam === BILL_PAYMENT_PRIORITY.IMMEDIATE || payPriorityParam === BILL_PAYMENT_PRIORITY.LATER
      ? payPriorityParam
      : "all";

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener(EVENTS.BILLS_REFRESH, handler);
    return () => window.removeEventListener(EVENTS.BILLS_REFRESH, handler);
  }, []);

  useEffect(() => {
    if (pendingOnly) return;
    if (sf !== normalizedStatus) {
      setSf(normalizedStatus);
      setPage(1);
    }
  }, [normalizedStatus, setSf, sf, pendingOnly]);

  const statusForApi =
    normalizedStatus && normalizedStatus !== "all"
      ? normalizedStatus === BILL_S.PARTIALLY_PAID
        ? "PartiallyPaid"
        : normalizedStatus
      : undefined;

  const paymentPriorityForApi =
    pendingOnly || payPriority === "all" ? undefined : payPriority;

  useEffect(() => {
    setLoading(true);
    getBills({
      page,
      pageSize,
      search: search || undefined,
      status: statusForApi,
      paymentPriority: paymentPriorityForApi,
      sortBy,
      desc: sortDesc,
    })
      .then((res) => {
        setBills(res.items);
        setTotalCount(res.totalCount ?? res.items.length);
        setTotalPages(res.totalPages ?? 1);
      })
      .catch(() => {
        setBills([]);
        setTotalCount(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, search, statusForApi, paymentPriorityForApi, refreshKey, sortBy, sortDesc]);

  const handleSort = (key: string) => {
    const n = nextListSort(key, sortBy, sortDesc);
    setSortBy(n.sortBy);
    setSortDesc(n.desc);
    setPage(1);
  };

  const f = fil(bills);
  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = totalCount === 0 ? 0 : Math.min(startIndex + pageSize, totalCount);
  const displayTotalPages = Math.max(totalPages, 1);
  const paged = f;
  const canAct = is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN);

  const centeredCellSx = {
    textAlign: "center" as const,
    verticalAlign: "middle" as const,
  };

  const leftCellSx = {
    textAlign: "left" as const,
    verticalAlign: "middle" as const,
  };

  const setBillFilter = (nextFilter: BillFilterOption["value"]) => {
    if (pendingOnly) return;
    const nextParams = new URLSearchParams(searchParams);
    if (nextFilter === "all") {
      nextParams.delete("status");
      nextParams.delete("payPriority");
    } else if (nextFilter.startsWith("pay:")) {
      nextParams.delete("status");
      nextParams.set("payPriority", nextFilter.slice(4));
    } else {
      nextParams.set("status", nextFilter);
      nextParams.delete("payPriority");
    }
    setSearchParams(nextParams, { replace: true });
    setPage(1);
  };

  const selectedBillFilterValue = payPriority !== "all" ? `pay:${payPriority}` : normalizedStatus;

  const orderedBillFilterTabs = useMemo(() => {
    const byValue = new Map(BILL_FILTER_OPTIONS.map((o) => [o.value, o]));
    const primary = BILL_TAB_PRIMARY_VALUES.map((v) => byValue.get(v)).filter((t): t is BillFilterOption => !!t);
    const rest = BILL_FILTER_OPTIONS.filter((t) => !BILL_TAB_PRIMARY_VALUES.includes(t.value));
    return [...primary, ...rest];
  }, []);

  const cols: TblCol[] = [
    { label: "Bill #", sortKey: "BillCode", sx: { textAlign: "left" } },
    { label: "Vendor", sortKey: "VendorName", sx: { textAlign: "left" } },
    { label: "Vendor bill #", sortKey: "VendorBillNumber", sx: { textAlign: "left" } },
    { label: "Amount", sortKey: "Amount" },
    { label: "TDS" },
    { label: "Payable", sortKey: "TotalPayable" },
    { label: "Balance Due", sortKey: "BalanceDue" },
    { label: "Due", sortKey: "DueDate" },
    { label: "Priority" },
    { label: "Status" },
    canAct && "Action",
  ];

  const rows = paged.map((b) => ({
    bill: b,
    _cells: [
      { v: <span style={{ fontWeight: 600, color: C.vendor }}>{b.id}</span>, sx: leftCellSx },
      {
        v: (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
            <span className="bills-vendor-avatar">
              <Av n={b.vName} sz={36} bg={C.successBg} color={C.vendor} />
            </span>
            <span style={{ fontWeight: 600, color: C.primary }}>{b.vName}</span>
          </div>
        ),
        sx: {
          textAlign: "left" as const,
          verticalAlign: "middle" as const,
        },
      },
      {
        v: <span style={{ fontWeight: 600, color: C.primary }}>{b.vendorBillNumber || "NA"}</span>,
        sx: leftCellSx,
      },
      { v: <span style={{ fontWeight: 600, color: C.primary }}>{fmtCur(b.amt)}</span>, sx: centeredCellSx },
      { v: <span style={{ color: C.danger }}>-{fmtCur(b.tdsAmt)}</span>, sx: centeredCellSx },
      { v: <span style={{ fontWeight: 700, color: C.primary }}>{fmtCur(b.pay)}</span>, sx: centeredCellSx },
      {
        v: (
          <span style={{ color: (b.pay - (b.paidAmount ?? 0)) > 0 ? C.vendor : C.muted }}>
            {fmtCur(b.pay - (b.paidAmount ?? 0))}
          </span>
        ),
        sx: centeredCellSx,
      },
      { v: <span style={{ color: C.muted }}>{b.due}</span>, sx: centeredCellSx },
      { v: <span style={{ fontWeight: 500 }}>{b.paymentPriority ?? "NA"}</span>, sx: centeredCellSx },
      {
        v: (
          <Badge
            s={b.status}
            overdueDays={b.status === BILL_S.OVERDUE ? daysOverdueFromDueYmd(b.due) : undefined}
          />
        ),
        sx: centeredCellSx,
      },
      ...(canAct
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
                  {(is(ROLES.APPROVER) || is(ROLES.FINANCE) || is(ROLES.ADMIN)) && b.status === BILL_S.SUBMITTED && (
                    <>
                      <Btn
                        sm
                        v="ghost"
                        sx={workflowTableActionStyle(C.success, C.successBg)}
                        onClick={() => setMdl({ t: MODAL_T.BILL_APPROVE, d: b, it: ITEM_T.BILL })}
                      >
                        <Check size={13} strokeWidth={1.9} />
                        Approve
                      </Btn>
                      <Btn
                        sm
                        v="ghost"
                        sx={workflowTableActionStyle(C.danger, C.dangerBg)}
                        onClick={() => setMdl({ t: MODAL_T.REJECT, d: b, it: ITEM_T.BILL })}
                      >
                        <X size={13} strokeWidth={1.9} />
                        Reject
                      </Btn>
                    </>
                  )}
                  {(is(ROLES.FINANCE) || is(ROLES.ADMIN)) &&
                    (b.status === BILL_S.APPROVED ||
                      b.status === BILL_S.OVERDUE ||
                      b.status === BILL_S.PARTIALLY_PAID) && (
                      <Btn
                        sm
                        v="ghost"
                        sx={workflowTableActionStyle(C.invoiceActionPaid, C.invoiceActionPaidBg)}
                        onClick={() => setMdl({ t: MODAL_T.PAY, d: b, it: ITEM_T.BILL })}
                      >
                        <IndianRupee size={13} strokeWidth={1.9} />
                        Pay
                      </Btn>
                    )}
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
          hidden={hideHeader}
          className="list-page-header"
          title="Vendor bills"
          icon={<ReceiptText size={24} strokeWidth={1.8} color={C.primary} />}
          search={
            <CollapsibleSearch
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search bills..."
            />
          }
          addAction={
            (is(ROLES.FINANCE) || is(ROLES.ADMIN)) && navAdd ? (
              <ListPageAddButton addPath={navAdd.addPath} label="Submit bill" />
            ) : undefined
          }
        >
      <style>{`
        @media (max-width: 640px) {
          .bills-table-card {
            margin-top: 20px;
          }

          .bills-vendor-avatar {
            display: none;
          }
        }
      `}</style>
      <div
        className="bills-table-card"
        style={{
          background: C.white,
          borderRadius: R.control,
          padding: "14px 16px 16px",
          marginTop: "26px",
          boxShadow: C.cardShadow,
        }}
      >
        <OverflowStatusTabs
          tabs={orderedBillFilterTabs}
          value={selectedBillFilterValue}
          onChange={setBillFilter}
          visibleCount={4}
          hidden={pendingOnly}
          onRefresh={() => setRefreshKey((k) => k + 1)}
          refreshDisabled={loading}
          refreshAriaLabel="Refresh bills"
        />

        <Tbl
          cols={cols}
          rows={loading ? [] : rows}
          onRow={(row) => setMdl({ t: MODAL_T.BILL_DETAIL, d: (row as (typeof rows)[number]).bill })}
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
                  Loading bills...
                </div>
                <div style={{ marginTop: "3px", fontSize: "12px" }}>Fetching vendor bills.</div>
              </div>
            ) : rows.length === 0 ? (
              <Empty
                icon={<ReceiptText size={38} strokeWidth={1.6} />}
                title={search.trim() ? "No bills found" : "No bills"}
                sub={search.trim() ? "Try a different search term." : "Submit a bill to start tracking payments."}
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
    </ListPageHeader>
  );
}
