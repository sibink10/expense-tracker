import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Av, Btn, Empty, ListRefreshButton, SortTh } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getClientsPaged } from "../shared/api/clients";
import type { Client } from "../types";
import { nextListSort } from "../shared/utils";

export default function ClientsPage() {
  const navigate = useNavigate();
  const { is, setMdl } = useAppContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState("CreatedAt");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("clients-refresh", handler);
    return () => window.removeEventListener("clients-refresh", handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    getClientsPaged({
      page,
      pageSize,
      search: debouncedSearch || undefined,
      sortBy,
      desc: sortDesc,
    })
      .then((r) => {
        setClients(r.items);
        setTotalCount(r.totalCount);
        setTotalPages(r.totalPages);
      })
      .catch(() => {
        setClients([]);
        setTotalCount(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, debouncedSearch, sortBy, sortDesc, refreshKey]);

  const handleSort = (key: string) => {
    const n = nextListSort(key, sortBy, sortDesc);
    setSortBy(n.sortBy);
    setSortDesc(n.desc);
    setPage(1);
  };

  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = totalCount === 0 ? 0 : Math.min(startIndex + pageSize, totalCount);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
          <span style={{ color: C.invoice }}>👥</span> Clients
        </h1>
        {is("admin") && (
          <Btn v="invoice" onClick={() => navigate("/clients/add")}>
            ＋ Add
          </Btn>
        )}
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "16px",
          border: `1px solid ${C.border}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          minHeight: "400px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {!loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flex: "1 1 auto", minWidth: 0 }}>
              <div style={{ position: "relative", flex: "1", minWidth: "180px", maxWidth: "280px" }}>
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search clients..."
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 32px",
                    border: `1.5px solid ${C.border}`,
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontFamily: "'DM Sans'",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: C.muted }}>⌕</span>
              </div>
              {searchInput.trim() && (
                <span style={{ fontSize: "12px", color: C.muted }}>
                  {totalCount} match{totalCount === 1 ? "" : "es"}
                </span>
              )}
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          <div style={{ flexShrink: 0, marginLeft: "auto" }}>
            <ListRefreshButton
              loading={loading}
              onRefresh={() => setRefreshKey((k) => k + 1)}
            />
          </div>
        </div>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
        ) : totalCount === 0 && !debouncedSearch ? (
          <Empty icon="👥" title="No clients" sub="Add clients to create invoices" />
        ) : (
          <>
            {totalCount === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: C.muted, fontSize: "13px" }}>No clients match your search</div>
            ) : (
              <>
                <div style={{ overflowX: "auto", borderRadius: "8px", border: `1px solid ${C.border}`, flex: 1 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: C.surface }}>
                        <SortTh sortKey="Name" sortBy={sortBy} sortDesc={sortDesc} onSortChange={handleSort}>
                          Client
                        </SortTh>
                        <SortTh sortKey="ContactPerson" sortBy={sortBy} sortDesc={sortDesc} onSortChange={handleSort}>
                          Contact person
                        </SortTh>
                        <SortTh sortKey="Email" sortBy={sortBy} sortDesc={sortDesc} onSortChange={handleSort}>
                          Email
                        </SortTh>
                        <SortTh sortKey="Country">Country</SortTh>
                        <SortTh sortKey="Currency">Currency</SortTh>
                        <SortTh sortKey="CustomerType">Type</SortTh>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => setMdl({ t: "client-detail", d: c })}
                          style={{
                            cursor: "pointer",
                            transition: "background 0.15s",
                            borderBottom: `1px solid ${C.border}`,
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.background = C.surface)}
                          onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <Av n={c.name} sz={36} />
                              <div>
                                <div style={{ fontWeight: 600, color: C.primary }}>{c.name}</div>
                                {c.gstin && <div style={{ fontSize: "11px", color: C.muted }}>{c.gstin}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px", fontSize: "12px", borderBottom: `1px solid ${C.border}` }}>{c.contact || "—"}</td>
                          <td style={{ padding: "12px 14px", fontSize: "12px", borderBottom: `1px solid ${C.border}` }}>{c.email || "—"}</td>
                          <td style={{ padding: "12px 14px", fontSize: "12px", color: C.muted, borderBottom: `1px solid ${C.border}` }}>{c.country || "—"}</td>
                          <td style={{ padding: "12px 14px", fontSize: "12px", borderBottom: `1px solid ${C.border}` }}>{c.currency || "—"}</td>
                          <td style={{ padding: "12px 14px", fontSize: "12px", borderBottom: `1px solid ${C.border}` }}>{c.customerType || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
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
          </>
        )}
      </div>
    </div>
  );
}
