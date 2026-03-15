import { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { Btn, Empty } from "../components/ui";
import { getTaxConfigs, toggleTaxConfig } from "../shared/api/taxConfig";
import type { TaxConfig } from "../types";

export default function AdminGstPage() {
  const [items, setItems] = useState<TaxConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("tax-config-refresh", handler);
    return () => window.removeEventListener("tax-config-refresh", handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    getTaxConfigs()
      .then((configs) => setItems(configs.filter((c) => c.type === "GST")))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      await toggleTaxConfig(id);
      window.dispatchEvent(new CustomEvent("tax-config-refresh"));
    } catch {
      // ignore
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 16px" }}>
        <span style={{ color: C.primary }}>📊</span> GST config
      </h1>
      <p style={{ color: C.muted, fontSize: "12px", margin: "0 0 20px" }}>
        GST rates from tax config. Add or edit via Tax config with type GST.
      </p>

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
        ) : items.length === 0 ? (
          <Empty icon="📊" title="No GST configs" sub="Add GST in Tax config" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
                fontSize: "12px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      borderBottom: `1px solid ${C.border}`,
                      fontWeight: 600,
                      color: C.muted,
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      padding: "8px 12px",
                      textAlign: "right",
                      borderBottom: `1px solid ${C.border}`,
                      fontWeight: 600,
                      color: C.muted,
                    }}
                  >
                    Rate
                  </th>
                  <th
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      borderBottom: `1px solid ${C.border}`,
                      fontWeight: 600,
                      color: C.muted,
                    }}
                  >
                    Sub type
                  </th>
                  <th
                    style={{
                      padding: "8px 12px",
                      textAlign: "center",
                      borderBottom: `1px solid ${C.border}`,
                      fontWeight: 600,
                      color: C.muted,
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "8px 12px",
                      borderBottom: `1px solid ${C.border}`,
                      fontWeight: 600,
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr
                    key={t.id}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{t.name}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{t.rate}%</td>
                    <td style={{ padding: "10px 12px" }}>{t.subType ?? "—"}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "10px",
                          fontWeight: 600,
                          background: t.isActive ? `${C.success}20` : `${C.muted}20`,
                          color: t.isActive ? C.success : C.muted,
                        }}
                      >
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <Btn
                        sm
                        v={t.isActive ? "secondary" : "success"}
                        onClick={() => handleToggle(t.id)}
                        disabled={togglingId === t.id}
                      >
                        {togglingId === t.id ? "..." : t.isActive ? "Deactivate" : "Activate"}
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
