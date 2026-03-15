import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Inp, Btn } from "../components/ui";
import { createClient } from "../shared/api/clients";
import { useAppContext } from "../context/AppContext";

export default function AddClientPage() {
  const navigate = useNavigate();
  const { is } = useAppContext();

  useEffect(() => {
    if (!is("admin")) navigate("/clients", { replace: true });
  }, [is, navigate]);

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

  const submit = async () => {
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await createClient({
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
      navigate("/clients");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "500px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px", color: C.invoice }}>
        Add client
      </h1>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
        }}
      >
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
          <div
            style={{
              padding: "10px 14px",
              background: C.dangerBg,
              color: C.danger,
              borderRadius: "8px",
              fontSize: "12px",
              marginBottom: "14px",
            }}
          >
            {error}
          </div>
        )}
        <Btn onClick={submit} disabled={!name.trim() || loading}>
          {loading ? "Adding..." : "Add client"}
        </Btn>
      </div>
    </div>
  );
}
