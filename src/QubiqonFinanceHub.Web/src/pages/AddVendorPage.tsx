import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Inp, Btn } from "../components/ui";
import { createVendor } from "../shared/api/vendor";

export default function AddVendorPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await createVendor({
        name: name.trim(),
        gstin: gstin.trim(),
        email: email.trim(),
        phone: phone.trim(),
        category: category.trim(),
        address: address.trim(),
      });
      navigate("/vendors");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "500px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px", color: C.vendor }}>
        Add vendor
      </h1>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
        }}
      >
        <Inp label="Name *" value={name} onChange={(e) => setName(e.target.value)} req ph="Vendor name" />
        <Inp label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} ph="GST number" />
        <Inp label="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="text" ph="email@example.com" />
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
          {loading ? "Adding..." : "Add vendor"}
        </Btn>
      </div>
    </div>
  );
}
