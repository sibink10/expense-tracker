import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Bill } from "../types";
import { C } from "../shared/theme";
import { BILL_S, BILL_PAYMENT_PRIORITY } from "../shared/constants";
import { fmtCur, daysOverdueFromDueYmd, nextListSort } from "../shared/utils";
import { Av, Btn, Badge, Tbl, Filter, Empty, ListRefreshButton, type TblCol } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getBills } from "../shared/api/bill";

export default function BillListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { search, setSearch, sf, setSf, fil, is, setMdl } = useAppContext();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const validStatusValues = new Set(["all", BILL_S.SUBMITTED, BILL_S.APPROVED, BILL_S.PAID, BILL_S.PARTIALLY_PAID, BILL_S.OVERDUE, BILL_S.REJECTED]);
  const statusParam = searchParams.get("status") ?? "all";
  const normalizedStatus = validStatusValues.has(statusParam) ? statusParam : "all";

  const payPriorityParam = searchParams.get("payPriority");
  const payPriority =
    payPriorityParam === BILL_PAYMENT_PRIORITY.IMMEDIATE || payPriorityParam === BILL_PAYMENT_PRIORITY.LATER
      ? payPriorityParam
      : "all";

  /** When filtering by payment priority, client-side status filter must stay "all". */
  const effectiveSfForContext = useMemo(() => {
    if (payPriority !== "all") return "all";
    return normalizedStatus;
  }, [payPriority, normalizedStatus]);

  const combinedFilterValue = useMemo(() => {
    if (payPriority !== "all") return `pay:${payPriority}`;
    return normalizedStatus;
  }, [payPriority, normalizedStatus]);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("bills-refresh", handler);
    return () => window.removeEventListener("bills-refresh", handler);
  }, []);

  useEffect(() => {
    if (sf !== effectiveSfForContext) {
      setSf(effectiveSfForContext);
      setPage(1);
    }
  }, [effectiveSfForContext, setSf, sf]);

  const statusForApi =
    effectiveSfForContext && effectiveSfForContext !== "all"
      ? effectiveSfForContext === BILL_S.PARTIALLY_PAID
        ? "PartiallyPaid"
        : effectiveSfForContext
      : undefined;

  const paymentPriorityForApi =
    payPriority === "all" ? undefined : payPriority;

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
  const paged = f;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
          <span style={{ color: C.vendor }}>📋</span> Vendor bills
        </h1>
        {(is("finance") || is("admin")) && (
          <Btn v="vendor" onClick={() => navigate("/bills/add")}>
            ＋ Submit bill
          </Btn>
        )}
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "16px",
          border: `1px solid ${C.border}`,
          minHeight: "400px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Filter
          search={search}
          onSearch={setSearch}
          status={combinedFilterValue}
          onStatus={() => {}}
          opts={[]}
          statusSlot={
            <select
              aria-label="Filter by status or payment priority"
              value={combinedFilterValue}
              onChange={(e) => {
                const next = e.target.value;
                const nextParams = new URLSearchParams(searchParams);
                if (next === "all") {
                  nextParams.delete("status");
                  nextParams.delete("payPriority");
                  setSf("all");
                } else if (next.startsWith("pay:")) {
                  nextParams.delete("status");
                  nextParams.set("payPriority", next.slice(4));
                  setSf("all");
                } else {
                  nextParams.delete("payPriority");
                  if (next !== "all") nextParams.set("status", next);
                  else nextParams.delete("status");
                  setSf(next);
                }
                setSearchParams(nextParams, { replace: true });
                setPage(1);
              }}
              style={{
                minWidth: "200px",
                maxWidth: "min(280px, 100%)",
                minHeight: "34px",
                padding: "6px 10px",
                borderRadius: "8px",
                border: `1.5px solid ${C.border}`,
                fontSize: "12px",
                fontWeight: 600,
                fontFamily: "'DM Sans'",
                color: C.primary,
                background: "#fff",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="all">All bills</option>
              <optgroup label="Status">
                <option value={BILL_S.SUBMITTED}>{BILL_S.SUBMITTED}</option>
                <option value={BILL_S.APPROVED}>{BILL_S.APPROVED}</option>
                <option value={BILL_S.PAID}>{BILL_S.PAID}</option>
                <option value={BILL_S.PARTIALLY_PAID}>{BILL_S.PARTIALLY_PAID}</option>
                <option value={BILL_S.OVERDUE}>{BILL_S.OVERDUE}</option>
                <option value={BILL_S.REJECTED}>{BILL_S.REJECTED}</option>
              </optgroup>
              <optgroup label="Payment priority">
                <option value={`pay:${BILL_PAYMENT_PRIORITY.IMMEDIATE}`}>Pay now</option>
                <option value={`pay:${BILL_PAYMENT_PRIORITY.LATER}`}>Pay later</option>
              </optgroup>
            </select>
          }
          trailing={
            <ListRefreshButton
              loading={loading}
              onRefresh={() => setRefreshKey((k) => k + 1)}
            />
          }
        />
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
        ) : f.length === 0 ? (
          <Empty icon="📋" title="No bills" sub="" />
        ) : (
          <>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Tbl
                cols={
                  [
                    { label: "Bill #", sortKey: "BillCode" },
                    { label: "Vendor", sortKey: "VendorName" },
                    { label: "Vendor bill #", sortKey: "VendorBillNumber" },
                    { label: "Amount", sortKey: "Amount" },
                    { label: "TDS" },
                    { label: "Payable", sortKey: "TotalPayable" },
                    { label: "Balance Due", sortKey: "BalanceDue" },
                    { label: "Due", sortKey: "DueDate" },
                    { label: "Priority" },
                    { label: "Status" },
                    ...(is("approver") || is("finance") || is("admin") ? (["Action"] as TblCol[]) : []),
                  ] as TblCol[]
                }
                sortBy={sortBy}
                sortDesc={sortDesc}
                onSortChange={handleSort}
                rows={paged.map((b) => ({
                  ...b,
                  _cells: [
                    { v: <span style={{ fontWeight: 600, color: C.vendor, fontSize: "11px" }}>{b.id}</span> },
                    {
                      v: (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Av n={b.vName} sz={24} v />
                          <span style={{ fontSize: "11px", fontWeight: 600 }}>{b.vName}</span>
                        </div>
                      ),
                    },
                    {
                      v: (
                        <span style={{ fontSize: "11px", fontWeight: 600, color: C.primary }}>
                          {b.vendorBillNumber || "—"}
                        </span>
                      ),
                    },
                    { v: <span style={{ fontWeight: 600 }}>{fmtCur(b.amt)}</span> },
                    { v: <span style={{ fontSize: "11px", color: C.danger }}>-{fmtCur(b.tdsAmt)}</span> },
                    { v: <span style={{ fontWeight: 700 }}>{fmtCur(b.pay)}</span> },
                    { v: <span style={{ fontSize: "11px", color: (b.pay - (b.paidAmount ?? 0)) > 0 ? C.vendor : C.muted }}>{fmtCur(b.pay - (b.paidAmount ?? 0))}</span> },
                    { v: <span style={{ fontSize: "11px", color: C.muted }}>{b.due}</span> },
                    {
                      v: (
                        <span style={{ fontSize: "11px", fontWeight: 500 }}>{b.paymentPriority ?? "—"}</span>
                      ),
                    },
                    {
                      v: (
                        <Badge
                          s={b.status}
                          overdueDays={
                            b.status === BILL_S.OVERDUE ? daysOverdueFromDueYmd(b.due) : undefined
                          }
                        />
                      ),
                    },
                    ...(is("approver") || is("finance") || is("admin")
                      ? [
                          {
                            v: (
                              <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", gap: "3px" }}>
                                {(is("approver") || is("admin")) && b.status === BILL_S.SUBMITTED && (
                                  <>
                                    <Btn sm v="success" onClick={() => setMdl({ t: "bill-approve", d: b, it: "bill" })}>✓</Btn>
                                    <Btn sm v="danger" onClick={() => setMdl({ t: "reject", d: b, it: "bill" })}>✕</Btn>
                                  </>
                                )}
                                {(is("finance") || is("admin")) && (b.status === BILL_S.APPROVED || b.status === BILL_S.OVERDUE || b.status === BILL_S.PARTIALLY_PAID) && (
                                  <Btn sm v="vendor" onClick={() => setMdl({ t: "pay", d: b, it: "bill" })}>Pay</Btn>
                                )}
                              </div>
                            ),
                          },
                        ]
                      : []),
                  ],
                }))}
                onRow={(row) => setMdl({ t: "bill-detail", d: row as unknown as Bill })}
              />
            </div>
            {!loading && totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "auto",
                  paddingTop: "16px",
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                <span style={{ fontSize: "12px", color: C.muted }}>
                  Showing {startIndex + 1}–{endIndex} of {totalCount}
                </span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Btn
                    sm
                    v="secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    ← Prev
                  </Btn>
                  <span style={{ fontSize: "12px", fontWeight: 500 }}>
                    Page {page} of {totalPages}
                  </span>
                  <Btn
                    sm
                    v="secondary"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next →
                  </Btn>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
