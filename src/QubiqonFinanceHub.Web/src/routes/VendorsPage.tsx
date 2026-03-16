import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Av, Btn, Empty } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getVendors } from "../shared/api/vendor";
import type { Vendor } from "../types";

export default function VendorsPage() {
  const navigate = useNavigate();
  const { is, setMdl } = useAppContext();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("vendors-refresh", handler);
    return () => window.removeEventListener("vendors-refresh", handler);
  }, []);

  useEffect(() => {
    getVendors()
      .then(setVendors)
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? vendors.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.email && v.email.toLowerCase().includes(q)) ||
          (v.gstin && v.gstin.toLowerCase().includes(q)) ||
          (v.contactPerson && v.contactPerson.toLowerCase().includes(q))
      )
    : vendors;

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
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
        ) : vendors.length === 0 ? (
          <Empty icon="🏢" title="No vendors" sub="Add vendors to manage bills" />
        ) : (
          <>
            <div style={{ marginBottom: "14px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1", minWidth: "180px", maxWidth: "280px" }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: C.muted }}>⌕</span>
              </div>
              {search.trim() && (
                <span style={{ fontSize: "12px", color: C.muted }}>{filtered.length} of {vendors.length}</span>
              )}
            </div>
            {filtered.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: C.muted, fontSize: "13px" }}>No vendors match your search</div>
            ) : (
              <div style={{ overflowX: "auto", borderRadius: "8px", border: `1px solid ${C.border}`, flex: 1 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: C.surface }}>
                      <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${C.border}` }}>
                        Vendor
                      </th>
                      <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${C.border}` }}>
                        GSTIN
                      </th>
                      <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${C.border}` }}>
                        Email
                      </th>
                      <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${C.border}` }}>
                        Contact
                      </th>
                      <th style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${C.border}` }}>
                        Category
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((v) => (
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
                        <td style={{ padding: "12px 14px", fontSize: "12px", color: C.muted, borderBottom: `1px solid ${C.border}` }}>{v.gstin || "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: "12px", borderBottom: `1px solid ${C.border}` }}>{v.email || "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: "12px", color: C.muted, borderBottom: `1px solid ${C.border}` }}>{v.contactPerson || "—"}</td>
                        <td style={{ padding: "12px 14px", fontSize: "12px", borderBottom: `1px solid ${C.border}` }}>{v.cat || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
