import { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { Inp, Btn, Mdl } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { updateVendor } from "../shared/api/vendor";
import type { Vendor } from "../types";

export default function VendorEditModal() {
  const { mdl, setMdl } = useAppContext();
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const v = mdl?.d && mdl.t === "vendor-edit" ? (mdl.d as Vendor) : null;

  useEffect(() => {
    if (v) {
      setName(v.name);
      setGstin(v.gstin || "");
      setEmail(v.email || "");
      setPhone(v.ph || "");
      setCategory(v.cat || "");
      setAddress(v.addr || "");
    }
  }, [v]);

  if (!v) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await updateVendor(v.id, {
        name: name.trim(),
        gstin: gstin.trim(),
        email: email.trim(),
        phone: phone.trim(),
        category: category.trim(),
        address: address.trim(),
      });
      setMdl(null);
      window.dispatchEvent(new CustomEvent("vendors-refresh"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title={`Edit ${v.name}`} w>
      <Inp label="Name *" value={name} onChange={(e) => setName(e.target.value)} req ph="Vendor name" />
      <Inp label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} ph="GST number" />
      <Inp label="Email" value={email} onChange={(e) => setEmail(e.target.value)} ph="email@example.com" />
      <Inp label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} ph="Contact number" />
      <Inp label="Category" value={category} onChange={(e) => setCategory(e.target.value)} ph="Vendor category" />
      <Inp
        label="Address"
        type="textarea"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        ph="Full address"
      />
      {error && (
        <div style={{ color: "var(--danger)", fontSize: "12px", marginBottom: "8px" }}>{error}</div>
      )}
      <div style={{ display: "flex", gap: "6px" }}>
        <Btn v="vendor" onClick={handleSubmit} disabled={!name.trim() || loading}>
          {loading ? "Saving..." : "Save"}
        </Btn>
        <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>
          Cancel
        </Btn>
      </div>
    </Mdl>
  );
}
