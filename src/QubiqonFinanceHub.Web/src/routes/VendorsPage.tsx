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
        }}
      >
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>Loading...</div>
        ) : vendors.length === 0 ? (
          <Empty icon="🏢" title="No vendors" sub="Add vendors to manage bills" />
        ) : (
          vendors.map((v) => (
            <div
              key={v.id}
              role="button"
              tabIndex={0}
              onClick={() => setMdl({ t: "vendor-detail", d: v })}
              onKeyDown={(e) => e.key === "Enter" && setMdl({ t: "vendor-detail", d: v })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                borderBottom: `1px solid ${C.border}`,
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <Av n={v.name} sz={36} v />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{v.name}</div>
                <div style={{ fontSize: "11px", color: C.muted }}>{v.gstin || "—"}</div>
                <div style={{ fontSize: "11px", color: C.muted }}>{v.email || "—"}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
