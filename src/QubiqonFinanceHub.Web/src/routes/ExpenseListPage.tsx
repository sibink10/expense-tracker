import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Expense } from "../types";
import { C } from "../shared/theme";
import { EXP_S } from "../shared/constants";
import { fmtCur } from "../shared/utils";
import { Btn, Badge, Tbl, Empty } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getExpensesMapped } from "../shared/api/expense";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: EXP_S.PENDING, value: "PendingApproval" },
  { label: EXP_S.PENDING_BILL_APPROVAL, value: "PendingBillApproval" },
  { label: EXP_S.APPROVED, value: "Approved" },
  { label: EXP_S.AWAITING_BILL, value: "AwaitingBill" },
  { label: EXP_S.COMPLETED, value: "Completed" },
  { label: EXP_S.REJECTED, value: "Rejected" },
] as const;

export default function ExpenseListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { is, setMdl } = useAppContext();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const validStatusValues = new Set<string>(STATUS_TABS.map((tab) => tab.value));
  const statusParam = searchParams.get("status") ?? "";
  const status = validStatusValues.has(statusParam) ? statusParam : "";
  const [data, setData] = useState<Expense[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const myOnly = is("employee");

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("expenses-refresh", handler);
    return () => window.removeEventListener("expenses-refresh", handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    getExpensesMapped({
      page,
      pageSize,
      search: search || undefined,
      status: status || undefined,
      myOnly,
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
  }, [page, pageSize, search, status, myOnly, refreshKey]);

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
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>Expense requests</h1>
        <Btn onClick={() => navigate("/expenses/add")}>＋ Add expense</Btn>
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
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="search"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "8px 12px",
              border: `1px solid ${C.border}`,
              borderRadius: "8px",
              width: "200px",
            }}
          />
          <div
            style={{
              display: "flex",
              gap: "4px",
              padding: "2px",
              background: "#f1f3f5",
              borderRadius: "8px",
              width: "fit-content",
            }}
          >
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value || "all"}
                type="button"
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams);
                  if (tab.value) nextParams.set("status", tab.value);
                  else nextParams.delete("status");
                  setSearchParams(nextParams, { replace: true });
                  setPage(1);
                }}
                style={{
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "6px",
                  background: status === tab.value ? "#e9ecef" : "transparent",
                  color: status === tab.value ? "#212529" : "#6c757d",
                  fontWeight: status === tab.value ? 600 : 400,
                  fontSize: "12px",
                  lineHeight: 1.2,
                  cursor: "pointer",
                  boxShadow: status === tab.value ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
        ) : data.length === 0 ? (
          <Empty icon="🧾" title="No expense requests" sub="" />
        ) : (
          <Tbl
            cols={[
              "ID",
              !is("employee") && "Employee",
              "Purpose",
              "Amount",
              "Bill date",
              "Status",
              (is("approver") || is("finance") || is("admin")) && "Action",
            ].filter(Boolean) as string[]}
            rows={data.map((e) => {
              const hasDocuments = e.documents.length > 0 || !!(e.file || e.attachmentUrl);
              const canShowPayAction = (is("finance") || is("admin")) && (e.status === EXP_S.APPROVED || e.status === EXP_S.PENDING_BILL_APPROVAL);
              return ({
                ...e,
                _cells: [
                { v: <span style={{ fontWeight: 600, color: C.accent, fontSize: "11px" }}>{e.id}</span> },
                ...(!is("employee") ? [{ v: <span style={{ fontSize: "11px" }}>{e.empName}</span> }] : []),
                { v: <div style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.purpose}</div> },
                { v: <span style={{ fontWeight: 700 }}>{fmtCur(e.amt)}</span> },
                { v: <span style={{ fontSize: "11px" }}>{e.billDate ?? "—"}</span> },
                { v: <Badge s={e.status} /> },
                ...(is("approver") || is("finance") || is("admin")
                  ? [
                      {
                        v: (
                          <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", gap: "3px" }}>
                            {(is("approver") || is("admin")) && e.status === EXP_S.PENDING && (
                              <>
                                <Btn sm v="success" onClick={() => setMdl({ t: "exp-approve", d: e })}>✓</Btn>
                                <Btn sm v="danger" onClick={() => setMdl({ t: "reject", d: e, it: "expense" })}>✕</Btn>
                              </>
                            )}
                            {canShowPayAction && (
                              <>
                                <Btn sm v="danger" onClick={() => setMdl({ t: "reject", d: e, it: "expense" })}>Reject</Btn>
                                <Btn sm v="info" onClick={() => setMdl({ t: "pay", d: e, it: "expense" })} disabled={!hasDocuments}>Pay</Btn>
                              </>
                            )}
                          </div>
                        ),
                      },
                    ]
                  : []),
                ],
              });
            })}
            onRow={(row) => setMdl({ t: "exp-detail", d: row as unknown as Expense })}
          />
        )}
        </div>
        {!loading && data.length > 0 && totalPages > 1 && (
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
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
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
      </div>
    </div>
  );
}
