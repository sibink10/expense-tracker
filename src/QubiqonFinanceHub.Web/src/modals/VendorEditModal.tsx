import { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { Inp, Btn, Mdl } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { updateVendor } from "../shared/api/vendor";
import { getCategories, type Category } from "../shared/api";
import { isEmailValid } from "../shared/utils";
import type { Vendor } from "../types";

export default function VendorEditModal() {
  const { mdl, setMdl } = useAppContext();
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
  const [categories, setCategories] = useState<Category[]>([]);

  const v = mdl?.d && mdl.t === "vendor-edit" ? (mdl.d as Vendor) : null;

  useEffect(() => {
    if (v) {
      setName(v.name);
      setGstin(v.gstin || "");
      setEmail(v.email || "");
      setPhone(v.ph || "");
      setCategory(v.cat || "");
      setAddress(v.addr || "");
      setContactPerson(v.contactPerson || "");
      setBankName(v.bankName || "");
      setAccountNumber(v.accountNumber || "");
      setAccountNumberRe(v.accountNumber || "");
      setIfscCode(v.ifscCode || "");
    }
  }, [v]);

  useEffect(() => {
    getCategories()
      .then((items) => setCategories(items.filter((c) => c.isActive)))
      .catch(() => setCategories([]));
  }, []);

  if (!v) return null;

  const handleSubmit = async () => {
    setEmailError(null);
    if (!isEmailValid(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (!name.trim() || !email.trim() || !address.trim()) return;
    if (!accountNumber.trim() || !accountNumberRe.trim()) {
      setError("Account number is required");
      return;
    }
    if (!bankName.trim() || !ifscCode.trim()) {
      setError("Bank name and IFSC code are required");
      return;
    }
    if (accountNumber.trim() !== accountNumberRe.trim()) {
      setError("Account numbers do not match");
      return;
    }

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
        contactPerson: contactPerson.trim() || undefined,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim() || undefined,
        ifscCode: ifscCode.trim(),
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
      <Inp label="Name" value={name} onChange={(e) => setName(e.target.value)} req ph="Vendor name" />
      <div>
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
      <Inp label="Contact person" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} ph="Optional" />
      <Inp label="GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)} ph="GST number" />
      <Inp label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} ph="Contact number" />
      <div>
        <Inp
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          ph="Vendor category"
          style={{ marginBottom: categories.length ? 6 : 14 }}
        />
        {categories.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.name)}
                style={{
                  padding: "3px 8px",
                  borderRadius: "999px",
                  border: `1px solid ${C.border}`,
                  background: category === c.name ? C.surface : "#fff",
                  fontSize: "10px",
                  cursor: "pointer",
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <Inp
        label="Address"
        type="textarea"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        req
        ph="Full address"
      />
      <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>
          Bank details
        </div>
        <Inp label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} ph="e.g. HDFC Bank" req />
        <Inp label="IFSC code" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} ph="e.g. HDFC0001234" req />
        <Inp label="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} ph="Account number" req />
        <Inp label="Re-enter account number" value={accountNumberRe} onChange={(e) => setAccountNumberRe(e.target.value)} ph="Re-enter account number" req />
      </div>
      {error && (
        <div style={{ color: "var(--danger)", fontSize: "12px", marginBottom: "8px" }}>{error}</div>
      )}
      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
        <Btn
          v="vendor"
          onClick={handleSubmit}
          disabled={
            !name.trim() ||
            !email.trim() ||
            !address.trim() ||
            !bankName.trim() ||
            !ifscCode.trim() ||
            !accountNumber.trim() ||
            !accountNumberRe.trim() ||
            !isEmailValid(email) ||
            loading
          }
        >
          {loading ? "Saving..." : "Save"}
        </Btn>
        <Btn v="secondary" onClick={() => setMdl(null)} disabled={loading}>
          Cancel
        </Btn>
      </div>
    </Mdl>
  );
}
