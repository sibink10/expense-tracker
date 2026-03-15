import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Advance } from "../types";
import { C } from "../shared/theme";
import { ADV_S } from "../shared/constants";
import { fmtCur } from "../shared/utils";
import { Btn, Badge, Tbl } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getAdvancesMyMapped } from "../shared/api/advance";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: ADV_S.PENDING, value: "Pending" },
  { label: ADV_S.APPROVED, value: "Approved" },
  { label: ADV_S.DISBURSED, value: "Disbursed" },
  { label: ADV_S.REJECTED, value: "Rejected" },
] as const;

export default function AdvanceListPage() {
  const navigate = useNavigate();
  const { is, setMdl } = useAppContext();
  const myOnly = is("employee");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState<Advance[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

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
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: C.advance }}>
          Advance requests
        </h1>
        {is("employee") && (
          <Btn v="advance" onClick={() => navigate("/advances/add")}>
            ＋ Request
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
                padding: "4px",
                background: "#f1f3f5",
                borderRadius: "10px",
                width: "fit-content",
              }}
            >
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value || "all"}
                  type="button"
                  onClick={() => {
                    setStatus(tab.value);
                    setPage(1);
                  }}
                  style={{
                    padding: "8px 14px",
                    border: "none",
                    borderRadius: "8px",
                    background: status === tab.value ? "#e9ecef" : "transparent",
                    color: status === tab.value ? "#212529" : "#6c757d",
                    fontWeight: status === tab.value ? 600 : 400,
                    fontSize: "13px",
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
            <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>No data found</div>
          ) : (
            <Tbl
              cols={[
                "ID",
                !is("employee") && "Employee",
                "Purpose",
                "Amount",
                "Status",
                (is("approver") || is("finance")) && "Action",
              ].filter(Boolean) as string[]}
              rows={data.map((a) => ({
                ...a,
                _cells: [
                  { v: <span style={{ fontWeight: 600, color: C.advance, fontSize: "11px" }}>{a.id}</span> },
                  ...(!is("employee") ? [{ v: <span style={{ fontSize: "11px" }}>{a.empName}</span> }] : []),
                  { v: <div style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.purpose}</div> },
                  { v: <span style={{ fontWeight: 700 }}>{fmtCur(a.amt)}</span> },
                  { v: <Badge s={a.status} /> },
                  ...(is("approver") || is("finance")
                    ? [
                        {
                          v: (
                            <div onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", gap: "3px" }}>
                            {is("approver") && a.status === ADV_S.PENDING && (
                              <>
                                <Btn sm v="success" onClick={() => setMdl({ t: "adv-approve", d: a })}>✓</Btn>
                                <Btn sm v="danger" onClick={() => setMdl({ t: "reject", d: a, it: "advance" })}>✕</Btn>
                              </>
                            )}
                              {is("finance") && a.status === ADV_S.APPROVED && (
                                <Btn sm v="advance" onClick={() => setMdl({ t: "adv-disburse", d: a })}>Disburse</Btn>
                              )}
                            </div>
                          ),
                        },
                      ]
                    : []),
                ],
              }))}
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
