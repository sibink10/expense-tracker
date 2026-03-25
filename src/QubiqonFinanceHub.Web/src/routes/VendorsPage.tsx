import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { TrashIcon } from "../components/icons";
import { Av, Btn, Empty, Inp, Mdl, ListRefreshButton, SortTh } from "../components/ui";
import { nextListSort } from "../shared/utils";
import { useAppContext } from "../context/AppContext";
import { getApiErrorMessage } from "../shared/api/client";
import { deleteVendor, getVendors } from "../shared/api/vendor";
import { getCategories, createCategory, toggleCategory, type Category } from "../shared/api";
import type { Vendor } from "../types";

export default function VendorsPage() {
  const navigate = useNavigate();
  const { is, setMdl, t } = useAppContext();
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
          <span style={{ color: C.vendor }}>🏢</span> Vendors
        </h1>
        {is("admin") && (
          <Btn v="vendor" onClick={() => navigate("/vendors/add")}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flex: "1 1 auto", minWidth: 0 }}>
            <div style={{ position: "relative", flex: "1", minWidth: "180px", maxWidth: "280px" }}>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search vendors..."
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
              <span
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "12px",
                  color: C.muted,
                }}
              >
                ⌕
              </span>
            </div>
            {search.trim() && totalCount > 0 && (
              <span style={{ fontSize: "12px", color: C.muted }}>
                Showing page {page} of {totalPages} — {totalCount} total
              </span>
            )}
          </div>
          <div style={{ flexShrink: 0, marginLeft: "auto" }}>
            <ListRefreshButton
              loading={loading}
              onRefresh={() => setRefreshKey((k) => k + 1)}
            />
          </div>
        </div>

        {loading && vendors.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
        ) : vendors.length === 0 ? (
          <Empty icon="🏢" title="No vendors" sub="Add vendors to manage bills" />
        ) : (
          <div style={{ overflowX: "auto", borderRadius: "8px", border: `1px solid ${C.border}`, flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: C.surface }}>
                  <SortTh sortKey="Name" sortBy={sortBy} sortDesc={sortDesc} onSortChange={handleSort}>
                    Vendor
                  </SortTh>
                  <SortTh sortKey="GSTIN">GSTIN</SortTh>
                  <SortTh sortKey="Email">Email</SortTh>
                  <SortTh sortKey="ContactPerson">Contact</SortTh>
                  <SortTh sortKey="Category">Category</SortTh>
                  {is("admin") && (
                    <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: C.muted, borderBottom: `1px solid ${C.border}` }}>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => setMdl({ t: "vendor-detail", d: v })}
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
                        <Av n={v.name} sz={36} v />
                        <div>
                          <div style={{ fontWeight: 600, color: C.primary }}>{v.name}</div>
                          {v.ph && <div style={{ fontSize: "11px", color: C.muted }}>{v.ph}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "12px", color: C.muted, borderBottom: `1px solid ${C.border}` }}>
                      {v.gstin || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "12px", borderBottom: `1px solid ${C.border}` }}>{v.email || "—"}</td>
                    <td style={{ padding: "12px 14px", fontSize: "12px", color: C.muted, borderBottom: `1px solid ${C.border}` }}>
                      {v.contactPerson || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", fontSize: "12px", borderBottom: `1px solid ${C.border}` }}>{v.cat || "—"}</td>
                    {is("admin") && (
                      <td
                        style={{ padding: "8px 12px", textAlign: "right", borderBottom: `1px solid ${C.border}`, verticalAlign: "middle" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span style={{ display: "inline-flex", gap: "6px", alignItems: "center", justifyContent: "flex-end" }}>
                          <Btn sm v="secondary" onClick={() => setMdl({ t: "vendor-edit", d: v })}>
                            ✎
                          </Btn>
                          <Btn sm v="danger" onClick={() => setDeleteTarget(v)}>
                            <TrashIcon size={16} color="#fff" />
                          </Btn>
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!loading && vendors.length > 0 && totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "16px",
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

      <Mdl
        open={!!deleteTarget}
        close={() => {
          if (!deleteLoading) setDeleteTarget(null);
        }}
        title="Remove vendor"
      >
        {deleteTarget && (
          <>
            <p style={{ margin: "0 0 20px", fontSize: "14px", color: C.muted }}>
              Remove <strong>{deleteTarget.name}</strong> from the directory? They will no longer appear in lists; existing bills linked to this vendor are unchanged.
            </p>
            {deleteError && (
              <p
                role="alert"
                style={{
                  margin: "0 0 16px",
                  fontSize: "13px",
                  color: "#b91c1c",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {deleteError}
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Btn v="secondary" sm disabled={deleteLoading} onClick={() => setDeleteTarget(null)}>
                Cancel
              </Btn>
              <Btn
                v="danger"
                sm
                disabled={deleteLoading}
                onClick={async () => {
                  setDeleteLoading(true);
                  setDeleteError(null);
                  try {
                    await deleteVendor(deleteTarget.id);
                    t("Vendor removed");
                    setDeleteTarget(null);
                    setRefreshKey((k) => k + 1);
                  } catch (err) {
                    const msg = getApiErrorMessage(err, "Failed to remove vendor");
                    setDeleteError(msg);
                    t(msg);
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
              >
                {deleteLoading ? "Removing…" : "Remove"}
              </Btn>
            </div>
          </>
        )}
      </Mdl>
    </div>
  );
}
