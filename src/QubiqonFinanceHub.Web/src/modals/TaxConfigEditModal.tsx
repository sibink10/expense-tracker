import { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { Inp, Btn, Mdl, Alert } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { updateTaxConfig } from "../shared/api/taxConfig";
import type { TaxConfig } from "../types";

const CLIENT_TAX_TYPE = "ClientTax";

export default function TaxConfigEditModal() {
  const { mdl, setMdl, t } = useAppContext();
  const tax = mdl?.d && mdl.t === "tax-config-edit" && "name" in mdl.d ? (mdl.d as TaxConfig) : null;

  const [type, setType] = useState<"TDS" | "GST" | typeof CLIENT_TAX_TYPE>("TDS");
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [section, setSection] = useState("");
  const [subType, setSubType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tax) {
      setType((tax.type as "TDS" | "GST" | typeof CLIENT_TAX_TYPE) || "TDS");
      setName(tax.name ?? "");
      setRate(String(tax.rate ?? ""));
      setSection(tax.section ?? "");
      setSubType(tax.subType ?? "");
    }
  }, [tax]);

  const handleSave = async () => {
    if (!tax?.id) return;
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    const r = parseFloat(rate);
    if (isNaN(r) || r < 0) {
      setError("Rate must be a valid number");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateTaxConfig(tax.id, {
        type,
        name: name.trim(),
        rate: r,
        section: section.trim(),
        subType: subType.trim(),
      });
      window.dispatchEvent(new CustomEvent("tax-config-refresh"));
      t("Tax config updated");
      setMdl(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update tax config");
    } finally {
      setLoading(false);
    }
  };

  if (!tax) return null;

  return (
    <Mdl open close={() => setMdl(null)} title={`Edit ${tax.name}`} w>
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
      <Inp label="Name" value={name} onChange={(e) => setName(e.target.value)} req ph="e.g. Professional Fees" />
      <Inp label="Rate (%)" type="number" value={rate} onChange={(e) => setRate(e.target.value)} req min="0" ph="0" />
      <Inp label="Section" value={section} onChange={(e) => setSection(e.target.value)} ph="e.g. 194 J" />
      <Inp label="Sub type" value={subType} onChange={(e) => setSubType(e.target.value)} ph="Optional" />
      {error && <Alert sx={{ marginBottom: "12px" }}>{error}</Alert>}
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>Cancel</Btn>
        <Btn v="primary" onClick={handleSave} disabled={!name.trim() || loading}>
          {loading ? "Saving…" : "Save"}
        </Btn>
      </div>
    </Mdl>
  );
}
