import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Inp, Btn } from "../components/ui";
import { createVendor } from "../shared/api/vendor";
import { isEmailValid } from "../shared/utils";

const GRID_BREAKPOINT = 600;

export default function AddVendorPage() {
  const navigate = useNavigate();
  const [narrow, setNarrow] = useState(typeof window !== "undefined" && window.innerWidth < GRID_BREAKPOINT);
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountNumberRe, setAccountNumberRe] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < GRID_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const submit = async () => {
    setEmailError(null);
    if (!isEmailValid(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (!name.trim() || !email.trim() || !address.trim()) return;
    if (accountNumber.trim() !== accountNumberRe.trim()) {
      setError("Account numbers do not match");
      return;
    }

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
        contactPerson: contactPerson.trim() || undefined,
        bankName: bankName.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        ifscCode: ifscCode.trim() || undefined,
      });
      navigate("/vendors");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add vendor");
    } finally {
      setLoading(false);
    }
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
    gap: "14px",
  };
  const cellStyle = { marginBottom: 0 };

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px", color: C.vendor }}>
        Add vendor
      </h1>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={gridStyle}>
          <Inp label="Name" value={name} onChange={(e) => setName(e.target.value)} req ph="Vendor name" style={cellStyle} />
          <div style={cellStyle}>
            <Inp
              label="Email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
              onBlur={() => email.trim() && !isEmailValid(email) && setEmailError("Enter a valid email address")}
              type="email"
              req
              ph="email@example.com"
              style={{ marginBottom: 0 }}
            />
            {emailError && <div style={{ fontSize: "11px", color: C.danger, marginTop: "4px" }}>{emailError}</div>}
          </div>
          <Inp label="Contact person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} ph="Optional" style={cellStyle} />
          <Inp label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} ph="GST number" style={cellStyle} />
          <Inp label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} ph="Contact number" style={cellStyle} />
          <Inp label="Category" value={category} onChange={(e) => setCategory(e.target.value)} ph="Vendor category" style={cellStyle} />
        </div>
        <Inp
          label="Address"
          type="textarea"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          req
          ph="Full address"
          style={{ marginTop: "14px" }}
        />

        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
            Bank details
          </div>
          <div style={gridStyle}>
            <Inp label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} ph="e.g. HDFC Bank" style={cellStyle} />
            <Inp label="IFSC code" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} ph="e.g. HDFC0001234" style={cellStyle} />
            <Inp label="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} ph="Account number" style={cellStyle} />
            <Inp label="Re-enter account number" value={accountNumberRe} onChange={(e) => setAccountNumberRe(e.target.value)} ph="Re-enter account number" style={cellStyle} />
          </div>
        </div>
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: C.dangerBg,
              color: C.danger,
              borderRadius: "8px",
              fontSize: "12px",
              marginTop: "16px",
              marginBottom: "14px",
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <Btn onClick={submit} disabled={!name.trim() || !email.trim() || !address.trim() || !isEmailValid(email) || loading}>
            {loading ? "Adding..." : "Add vendor"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
