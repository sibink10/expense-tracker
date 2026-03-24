import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Advance } from "../types";
import { C } from "../shared/theme";
import { ADV_S } from "../shared/constants";
import { fmtCur, nextListSort } from "../shared/utils";
import { Btn, Badge, Tbl, Empty, ListRefreshButton, type TblCol } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getAdvancesMyMapped } from "../shared/api/advance";
import { advanceRaisedByCurrentUser, canCancelAdvanceRequest } from "../shared/expensePermissions";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: ADV_S.PENDING, value: "Pending" },
  { label: ADV_S.APPROVED, value: "Approved" },
  { label: ADV_S.DISBURSED, value: "Disbursed" },
  { label: ADV_S.PARTIALLY_DISBURSED, value: "PartiallyDisbursed" },
  { label: ADV_S.REJECTED, value: "Rejected" },
  { label: ADV_S.CANCELLED, value: "Cancelled" },
] as const;

export default function AdvanceListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { is, setMdl, user } = useAppContext();
  const myOnly = is("employee");
  const showActionCol =
    is("approver") || is("finance") || is("admin") || is("employee");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [search, setSearch] = useState("");
  const validStatusValues = new Set<string>(STATUS_TABS.map((tab) => tab.value));
  const statusParam = searchParams.get("status") ?? "";
  const status = validStatusValues.has(statusParam) ? statusParam : "";
  const [data, setData] = useState<Advance[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("advances-refresh", handler);
    return () => window.removeEventListener("advances-refresh", handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    getAdvancesMyMapped({
      page,
      pageSize,
      search: search || undefined,
      status: status || undefined,
      myOnly,
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
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: C.advance }}>
          Advance requests
        </h1>
        <Btn v="advance" onClick={() => navigate("/advances/add")}>
          ＋ Request
        </Btn>
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
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                flex: "1 1 auto",
                minWidth: 0,
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
            <div style={{ flexShrink: 0, marginLeft: "auto" }}>
              <ListRefreshButton
                loading={loading}
                onRefresh={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          </div>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
          ) : data.length === 0 ? (
            <Empty icon="💸" title="No advance requests" sub="" />
          ) : (
            <Tbl
              cols={
                [
                  { label: "ID", sortKey: "AdvanceCode" },
                  ...(!is("employee") ? [{ label: "Employee", sortKey: "Employee" }] : []),
                  { label: "Purpose", sortKey: "Purpose" },
                  { label: "Amount", sortKey: "Amount" },
                  { label: "Balance Due", sortKey: "BalanceDue" },
                  { label: "Status" },
                  ...(showActionCol ? (["Action"] as TblCol[]) : []),
                ] as TblCol[]
              }
              sortBy={sortBy}
              sortDesc={sortDesc}
              onSortChange={handleSort}
              rows={data.map((a) => {
                const canCancelAdvanceRow = canCancelAdvanceRequest(a, user);
                const canSelfApprove = advanceRaisedByCurrentUser(a, user);
                return {
                  ...a,
                  _cells: [
                    { v: <span style={{ fontWeight: 600, color: C.advance, fontSize: "11px" }}>{a.id}</span> },
                    ...(!is("employee") ? [{ v: <span style={{ fontSize: "11px" }}>{a.empName}</span> }] : []),
                    { v: <div style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.purpose}</div> },
                    { v: <span style={{ fontWeight: 700 }}>{fmtCur(a.amt)}</span> },
                    { v: <span style={{ fontSize: "11px", color: (a.amt - (a.paidAmount ?? 0)) > 0 ? C.advance : C.muted }}>{fmtCur(a.amt - (a.paidAmount ?? 0))}</span> },
                    { v: <Badge s={a.status} /> },
                    ...(showActionCol
                      ? [
                          {
                            v: (
                              <div
                                role="presentation"
                                onClick={(ev) => ev.stopPropagation()}
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  alignItems: "center",
                                  justifyContent: "flex-start",
                                  gap: "6px",
                                  width: "100%",
                                }}
                              >
                                {(is("approver") || is("admin")) &&
                                  !canSelfApprove &&
                                  a.status !== ADV_S.CANCELLED &&
                                  a.status === ADV_S.PENDING && (
                                    <>
                                      <Btn sm v="success" onClick={() => setMdl({ t: "adv-approve", d: a })}>✓</Btn>
                                      <Btn sm v="danger" onClick={() => setMdl({ t: "reject", d: a, it: "advance" })}>✕</Btn>
                                    </>
                                  )}
                                {(is("finance") || is("admin")) &&
                                  a.status !== ADV_S.CANCELLED &&
                                  (a.status === ADV_S.APPROVED || a.status === ADV_S.PARTIALLY_DISBURSED) && (
                                    <>
                                      <Btn sm v="advance" onClick={() => setMdl({ t: "adv-disburse", d: a })}>Disburse</Btn>
                                      <Btn sm v="danger" onClick={() => setMdl({ t: "reject", d: a, it: "advance" })}>✕</Btn>
                                    </>
                                  )}
                                {canCancelAdvanceRow && (
                                  <Btn
                                    sm
                                    v="secondary"
                                    onClick={() => setMdl({ t: "adv-cancel-confirm", d: a })}
                                  >
                                    Cancel
                                  </Btn>
                                )}
                              </div>
                            ),
                            sx: { textAlign: "left" as const, verticalAlign: "middle" },
                          },
                        ]
                      : []),
                  ],
                };
              })}
              onRow={(row) => setMdl({ t: "adv-detail", d: row as unknown as Advance })}
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
