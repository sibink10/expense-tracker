import { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { Inp, Btn, Empty, Toggle, Alert } from "../components/ui";
import { getTaxConfigs, createTaxConfig, toggleTaxConfig } from "../shared/api/taxConfig";
import { useAppContext } from "../context/AppContext";
import type { TaxConfig } from "../types";

const CLIENT_TAX_TYPE = "ClientTax";
const formatTaxType = (value?: string) => value === CLIENT_TAX_TYPE ? "Client Tax" : (value ?? "—");

export default function AdminTaxPage() {
  const { t, setMdl } = useAppContext();
  const [items, setItems] = useState<TaxConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [type, setType] = useState<"TDS" | "GST" | typeof CLIENT_TAX_TYPE>("TDS");
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [section, setSection] = useState("");
  const [subType, setSubType] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("tax-config-refresh", handler);
    return () => window.removeEventListener("tax-config-refresh", handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    getTaxConfigs()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    const r = parseFloat(rate);
    if (isNaN(r) || r < 0) {
      setError("Rate must be a valid number");
      return;
    }
    setSubmitLoading(true);
    setError(null);
    try {
      await createTaxConfig({
        type,
        name: name.trim(),
        rate: r,
        section: section.trim(),
        subType: subType.trim(),
      });
      setType("TDS");
      setName("");
      setRate("");
      setSection("");
      setSubType("");
      window.dispatchEvent(new CustomEvent("tax-config-refresh"));
      t("Tax config added");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add tax config");
    } finally {
      setSubmitLoading(false);
    }
  };

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
        <span style={{ color: C.primary }}>📊</span> Tax config
      </h1>

      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
          marginBottom: "20px",
        }}
      >
        <h2 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 14px", color: C.primary }}>
          Add tax config
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <Inp
            label="Type"
            type="select"
            value={type}
            onChange={(e) => setType(e.target.value as "TDS" | "GST" | typeof CLIENT_TAX_TYPE)}
            opts={[
              { v: "TDS", l: "TDS" },
              { v: "GST", l: "GST" },
              { v: CLIENT_TAX_TYPE, l: "Client Tax" },
            ]}
          />
          <Inp
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            req
            ph="e.g. Professional Fees"
          />
          <Inp
            label="Rate (%)"
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            req
            min="0"
            ph="0"
          />
          <Inp
            label="Section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            ph="e.g. 194 J"
          />
          <Inp
            label="Sub type"
            value={subType}
            onChange={(e) => setSubType(e.target.value)}
            ph="Optional"
          />
        </div>
        {error && <Alert sx={{ marginBottom: "12px" }}>{error}</Alert>}
        <Btn v="primary" onClick={handleAdd} disabled={!name.trim() || submitLoading}>
          {submitLoading ? "Adding..." : "Add"}
        </Btn>
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
        ) : items.length === 0 ? (
          <Empty icon="📊" title="No tax configs" sub="Add a tax config above" />
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
                    Type
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
                    Section
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
                      textAlign: "left",
                      borderBottom: `1px solid ${C.border}`,
                      fontWeight: 600,
                      color: C.muted,
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <td style={{ padding: "10px 12px" }}>{formatTaxType(item.type)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{item.name}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right" }}>{item.rate}%</td>
                    <td style={{ padding: "10px 12px" }}>{item.section || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>{item.subType ?? "—"}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "10px",
                          fontWeight: 600,
                          background: item.isActive ? `${C.success}20` : `${C.muted}20`,
                          color: item.isActive ? C.success : C.muted,
                        }}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                        <Btn sm v="secondary" onClick={() => setMdl({ t: "tax-config-detail", d: item })}>View</Btn>
                        <Btn sm v="primary" onClick={() => setMdl({ t: "tax-config-edit", d: item })}>Edit</Btn>
                        <Toggle
                          checked={item.isActive}
                          onChange={() => handleToggle(item.id)}
                        />
                      </div>
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
