import { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { Inp, Btn, Mdl } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { updateClient } from "../shared/api/clients";
import type { Client } from "../types";

export default function ClientEditModal() {
  const { mdl, setMdl } = useAppContext();
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [taxType, setTaxType] = useState("Domestic");
  const [gstin, setGstin] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const c = mdl?.d && mdl.t === "client-edit" ? (mdl.d as Client) : null;

  useEffect(() => {
    if (c) {
      setName(c.name);
      setContactPerson(c.contact || "");
      setEmail(c.email || "");
      setPhone(c.phone || "");
      setCountry(c.country || "");
      setCurrency(c.currency || "INR");
      setTaxType(c.taxType || "Domestic");
      setGstin(c.gstin || "");
      setAddress(c.addr || "");
    }
  }, [c]);

  if (!c) return null;

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await updateClient(c.id, {
        name: name.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        country: country.trim(),
        currency: currency.trim() || "INR",
        taxType: taxType.trim(),
        gstin: gstin.trim(),
        address: address.trim(),
      });
      setMdl(null);
      window.dispatchEvent(new CustomEvent("clients-refresh"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => setMdl(null)} title={`Edit ${c.name}`} w>
      <Inp label="Name *" value={name} onChange={(e) => setName(e.target.value)} req ph="Client name" />
      <Inp label="Contact person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} ph="Contact name" />
      <Inp label="Email" value={email} onChange={(e) => setEmail(e.target.value)} ph="email@example.com" />
      <Inp label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} ph="Contact number" />
      <Inp label="Country" value={country} onChange={(e) => setCountry(e.target.value)} ph="Country" />
      <Inp label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} ph="INR, USD, EUR..." />
      <Inp
        label="Tax type"
        type="select"
        value={taxType}
        onChange={(e) => setTaxType(e.target.value)}
        opts={[
          { v: "Domestic", l: "Domestic" },
          { v: "SEZ", l: "SEZ" },
          { v: "Export", l: "Export" },
        ]}
      />
      <Inp label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} ph="GST number" />
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
        <Btn v="invoice" onClick={handleSubmit} disabled={!name.trim() || loading}>
          {loading ? "Saving..." : "Save"}
        </Btn>
        <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>
          Cancel
        </Btn>
      </div>
    </Mdl>
  );
}
