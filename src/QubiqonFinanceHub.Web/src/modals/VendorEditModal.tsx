import { useState, useEffect } from "react";
import { C } from "../shared/theme";
import { Inp, Btn, Mdl, Alert } from "../components/ui";
import PhoneInputField, { isValidPhoneNumber } from "../components/PhoneInputField";
import { normalizeStoredPhone } from "../shared/phoneUtils";
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
  const [phone, setPhone] = useState<string | undefined>(undefined);
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
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const v = mdl?.d && mdl.t === "vendor-edit" ? (mdl.d as Vendor) : null;

  useEffect(() => {
    if (v) {
      setName(v.name);
      setGstin(v.gstin || "");
      setEmail(v.email || "");
      setPhone(normalizeStoredPhone(v.ph || undefined) ?? undefined);
      setCategory(v.cat || "");
      setAddress(v.addr || "");
      setContactPerson(v.contactPerson || "");
      setBankName(v.bankName || "");
      setAccountNumber(v.accountNumber || "");
      setAccountNumberRe(v.accountNumber || "");
      setIfscCode(v.ifscCode || "");
      setPhoneError(null);
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
    if (phone?.trim() && !isValidPhoneNumber(phone.trim())) {
      setPhoneError("Enter a valid phone number for the selected country");
      return;
    }
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
        phone: phone?.trim() ?? "",
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
      <div style={{ marginBottom: "14px" }}>
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
      <PhoneInputField
        label="Phone"
        value={phone}
        onChange={(v) => {
          setPhone(v);
          setPhoneError(null);
        }}
        onBlur={() =>
          phone?.trim() &&
          !isValidPhoneNumber(phone.trim()) &&
          setPhoneError("Enter a valid phone number for the selected country")
        }
        error={phoneError}
        placeholder="Optional"
      />
      <Inp
        label="Category"
        type="select"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        opts={[
          { v: "", l: categories.length ? "Select category..." : "No categories" },
          ...categories.map((c) => ({ v: c.name, l: c.name })),
        ]}
      />
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
      {error && <Alert sx={{ marginBottom: "8px" }}>{error}</Alert>}
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
            (!!phone?.trim() && !isValidPhoneNumber(phone.trim())) ||
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
