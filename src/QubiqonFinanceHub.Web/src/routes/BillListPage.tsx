import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Bill } from "../types";
import { C } from "../shared/theme";
import { BILL_S } from "../shared/constants";
import { fmtCur } from "../shared/utils";
import { Av, Btn, Badge, Tbl, Filter, Empty } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getBills } from "../shared/api/bill";

export default function BillListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { search, setSearch, sf, setSf, fil, is, setMdl } = useAppContext();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const validStatusValues = new Set(["all", BILL_S.SUBMITTED, BILL_S.APPROVED, BILL_S.PAID, BILL_S.OVERDUE, BILL_S.REJECTED]);
  const statusParam = searchParams.get("status") ?? "all";
  const normalizedStatus = validStatusValues.has(statusParam) ? statusParam : "all";

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("bills-refresh", handler);
    return () => window.removeEventListener("bills-refresh", handler);
  }, []);

  useEffect(() => {
    if (sf !== normalizedStatus) {
      setSf(normalizedStatus);
      setPage(1);
    }
  }, [normalizedStatus, setSf, sf]);

  useEffect(() => {
    setLoading(true);
    getBills({
      page,
      pageSize,
      search: search || undefined,
      status: sf && sf !== "all" ? sf : undefined,
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
  }, [page, pageSize, search, sf, refreshKey]);

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
          status={sf}
          onStatus={(nextStatus) => {
            setSf(nextStatus);
            const nextParams = new URLSearchParams(searchParams);
            if (nextStatus && nextStatus !== "all") nextParams.set("status", nextStatus);
            else nextParams.delete("status");
            setSearchParams(nextParams, { replace: true });
            setPage(1);
          }}
          opts={[
            "all",
            BILL_S.SUBMITTED,
            BILL_S.APPROVED,
            BILL_S.PAID,
            BILL_S.OVERDUE,
            BILL_S.REJECTED,
          ]}
        />
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
        ) : f.length === 0 ? (
          <Empty icon="📋" title="No bills" sub="" />
        ) : (
          <>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Tbl
                cols={[
                  "Bill #",
                  "Vendor",
                  "Vendor bill #",
                  "Amount",
                  "TDS",
                  "Payable",
                  "Due",
                  "Status",
                  (is("approver") || is("finance") || is("admin")) && "Action",
                ].filter(Boolean) as string[]}
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
                    { v: <span style={{ fontSize: "11px", color: C.muted }}>{b.due}</span> },
                    { v: <Badge s={b.status} /> },
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
                                {(is("finance") || is("admin")) && (b.status === BILL_S.APPROVED || b.status === BILL_S.OVERDUE) && (
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
