import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Inp, Btn, Alert } from "../components/ui";
import PhoneInputField, { isValidPhoneNumber } from "../components/PhoneInputField";
import { createVendor } from "../shared/api/vendor";
import { getCategories, type Category } from "../shared/api";
import type { Vendor } from "../types";
import { isEmailValid } from "../shared/utils";
import { useAppContext } from "../context/AppContext";

const GRID_BREAKPOINT = 600;

export default function AddVendorPage() {
  const navigate = useNavigate();
  const { t } = useAppContext();
  const [narrow, setNarrow] = useState(typeof window !== "undefined" && window.innerWidth < GRID_BREAKPOINT);
  const [name, setName] = useState("");
  const [gstin, setGstin] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<string | undefined>(undefined);
  const [phoneError, setPhoneError] = useState<string | null>(null);
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

  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < GRID_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    getCategories()
      .then((items) => setCategories(items.filter((c) => c.isActive)))
      .catch(() => setCategories([]));
  }, []);

  const submit = async () => {
    setEmailError(null);
    setPhoneError(null);
    if (!isEmailValid(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (!name.trim() || !email.trim() || !address.trim()) return;
    if (!phone?.trim()) {
      setPhoneError("Phone number is required");
      return;
    }
    if (!isValidPhoneNumber(phone.trim())) {
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
      await createVendor({
        name: name.trim(),
        gstin: gstin.trim(),
        email: email.trim(),
        phone: phone!.trim(),
        category: category.trim(),
        address: address.trim(),
        contactPerson: contactPerson.trim() || undefined,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim() || undefined,
        ifscCode: ifscCode.trim(),
      });
      t("Vendor added");
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
          <div style={cellStyle}>
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
              required
              error={phoneError}
              placeholder="Contact number"
              style={{ marginBottom: 0 }}
            />
          </div>
          <Inp
            label="Category"
            type="select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            opts={[
              { v: "", l: categories.length ? "Select category..." : "No categories" },
              ...categories.map((c) => ({ v: c.name, l: c.name })),
            ]}
            style={cellStyle}
          />
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
            <Inp label="Bank name" value={bankName} onChange={(e) => setBankName(e.target.value)} ph="e.g. HDFC Bank" req style={cellStyle} />
            <Inp label="IFSC code" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} ph="e.g. HDFC0001234" req style={cellStyle} />
            <Inp
              label="Account number"
              type="password"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              ph="Account number"
              req
              style={cellStyle}
              hint="Digits only; masked while typing. You can copy and paste."
            />
            <Inp
              label="Re-enter account number"
              type="text"
              value={accountNumberRe}
              onChange={(e) => setAccountNumberRe(e.target.value.replace(/\D/g, ""))}
              ph="Re-enter account number"
              req
              style={cellStyle}
              hint="Must match the account number above."
            />
          </div>
        </div>
        {error && <Alert sx={{ marginTop: "16px", marginBottom: "14px" }}>{error}</Alert>}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <Btn
            onClick={submit}
            disabled={
              !name.trim() ||
              !email.trim() ||
              !phone?.trim() ||
              !address.trim() ||
              !bankName.trim() ||
              !ifscCode.trim() ||
              !accountNumber.trim() ||
              !accountNumberRe.trim() ||
              !isEmailValid(email) ||
              !!phoneError ||
              (!!phone?.trim() && !isValidPhoneNumber(phone.trim())) ||
              loading
            }
          >
            {loading ? "Adding..." : "Add vendor"}
          </Btn>
        </div>
      </div>
    </div>
  );
}
