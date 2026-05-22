import { useState } from "react";
import { Inp, Btn, Mdl, Alert } from "../../ui";
import { useAppContext } from "../../../context/AppContext";
import { createTaxConfig } from "../../../shared/api/taxConfig";

const CLIENT_TAX_TYPE = "ClientTax";

export default function TaxConfigAddModal() {
  const { setMdl, t } = useAppContext();
  const [type, setType] = useState<"TDS" | "GST" | typeof CLIENT_TAX_TYPE>("TDS");
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [section, setSection] = useState("");
  const [subType, setSubType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
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
      await createTaxConfig({
        type,
        name: name.trim(),
        rate: r,
        section: section.trim(),
        subType: subType.trim(),
      });
      window.dispatchEvent(new CustomEvent("tax-config-refresh"));
      t("Tax config added");
      setMdl(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add tax config");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title="Add tax" w>
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
        <Btn v="primary" onClick={handleAdd} disabled={!name.trim() || loading}>
          {loading ? "Adding..." : "Add"}
        </Btn>
      </div>
    </Mdl>
  );
}
